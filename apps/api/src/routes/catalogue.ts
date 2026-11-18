import { withImageUrls } from "./media.js";
import { imageUrl } from "../services/backblaze.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  categories,
  products,
  mediaAssets,
  productVariants,
} from "../db/schema.js";
import { productInput, slugFor } from "../lib/product-input.js";
import { publicVariants } from "../lib/variants.js";

// Registered inside the authenticated admin route scope.
export const catalogueRoutes: FastifyPluginAsync = async (app) => {
  app.get("/categories", async () =>
    db.select().from(categories).orderBy(categories.code),
  );
  // Each row carries a short-lived link to its main gallery photo for the CRM list.
  app.get("/products", async () => {
    const [rows, images] = await Promise.all([
      db.select().from(products).orderBy(desc(products.createdAt)),
      db
        .select({ productId: mediaAssets.productId, storageKey: mediaAssets.storageKey, isPrimary: mediaAssets.isPrimary })
        .from(mediaAssets)
        .where(and(isNotNull(mediaAssets.productId), eq(mediaAssets.kind, "gallery")))
        .orderBy(desc(mediaAssets.isPrimary), mediaAssets.createdAt),
    ]);
    const mainImage = new Map<string, string>();
    for (const image of images)
      if (image.productId && !mainImage.has(image.productId))
        mainImage.set(image.productId, image.storageKey);
    return Promise.all(
      rows.map(async (row) => {
        const storageKey = mainImage.get(row.id);
        // Without storage settings the list still loads, just without thumbnails.
        const thumbnailUrl = storageKey ? await imageUrl(storageKey).catch(() => null) : null;
        return { ...row, thumbnailUrl };
      }),
    );
  });
  const params = z.object({ id: z.string().uuid() });
  app.get("/products/:id", async (request, reply) => {
    const { id } = params.parse(request.params);
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!product) return reply.code(404).send({ message: "Product not found" });
    const media = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.productId, id))
      .orderBy(desc(mediaAssets.isPrimary), mediaAssets.createdAt);
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.sortOrder), productVariants.createdAt);
    const withUrls = await withImageUrls(media);
    return {
      ...product,
      media: withUrls.filter((image) => image.kind === "gallery"),
      roomImage: withUrls.find((image) => image.kind === "room") ?? null,
      cutoutImage: withUrls.find((image) => image.kind === "cutout") ?? null,
      variants: publicVariants(product, variants),
    };
  });
  async function save(
    request: FastifyRequest,
    reply: FastifyReply,
    productId?: string,
  ) {
    const input = productInput.parse(request.body);
    try {
      const product = await db.transaction(async (tx) => {
        let existing: typeof products.$inferSelect | undefined;
        if (productId) {
          [existing] = await tx
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1)
            .for("update");
          if (!existing) throw app.httpErrors.notFound("Product not found");
        }
        let categoryId = input.categoryId;
        if (input.newCategory) {
          const id = randomUUID();
          const translations = Object.fromEntries(
            (["bs", "en"] as const).map((locale) => [
              locale,
              {
                name: input.newCategory![locale],
                slug: slugFor(input.newCategory![locale], id),
                description: "",
              },
            ]),
          );
          const [category] = await tx
            .insert(categories)
            .values({
              id,
              code: `category-${id}`,
              translations,
              seo: Object.fromEntries(
                (["bs", "en"] as const).map((locale) => [
                  locale,
                  { title: input.newCategory![locale], description: "" },
                ]),
              ),
            })
            .returning();
          categoryId = category.id;
        } else {
          const [category] = await tx
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.id, categoryId!))
            .limit(1);
          if (!category)
            throw app.httpErrors.badRequest(
              "The selected category no longer exists",
            );
        }
        const {
          newCategory: _newCategory,
          images,
          roomImage,
          cutoutImage,
          variants,
          ...fields
        } = input;
        const primaryVariant = variants[0];
        const id = productId ?? randomUUID();
        const translations = Object.fromEntries(
          (["bs", "en"] as const).map((locale) => [
            locale,
            {
              ...input.translations[locale],
              slug:
                existing?.translations[locale]?.slug ??
                slugFor(input.translations[locale].name, id),
            },
          ]),
        );
        const now = new Date();
        const values = {
          ...fields,
          id,
          categoryId: categoryId!,
          sku: primaryVariant.sku,
          dimensions: primaryVariant.dimensions,
          price: primaryVariant.price,
          translations,
          seo: Object.fromEntries(
            (["bs", "en"] as const).map((locale) => [
              locale,
              {
                title: `${input.translations[locale].name} | Drvenija`,
                description:
                  input.translations[locale].shortDescription ||
                  input.translations[locale].description.slice(0, 160),
              },
            ]),
          ),
        };
        let saved: typeof products.$inferSelect;
        if (productId) {
          const [updated] = await tx
            .update(products)
            .set({ ...values, updatedAt: new Date() })
            .where(eq(products.id, productId))
            .returning();
          saved = updated;
        } else {
          const [created] = await tx
            .insert(products)
            .values(values)
            .returning();
          saved = created;
        }
        // Keep variant IDs stable so carts and links that reference them survive edits.
        const current = productId
          ? await tx
              .select({ id: productVariants.id })
              .from(productVariants)
              .where(eq(productVariants.productId, id))
              .for("update")
          : [];
        const currentIds = new Set(current.map((variant) => variant.id));
        if (variants.some((variant) => variant.id && !currentIds.has(variant.id)))
          throw app.httpErrors.badRequest(
            "A variant no longer exists. Reload the product and try again.",
          );
        const keptIds = new Set(variants.flatMap((variant) => (variant.id ? [variant.id] : [])));
        const removedIds = [...currentIds].filter((variantId) => !keptIds.has(variantId));
        if (removedIds.length)
          await tx
            .delete(productVariants)
            .where(inArray(productVariants.id, removedIds));
        // Park kept SKUs on their unique IDs first so swapping SKUs between variants
        // doesn't trip the unique constraint mid-update.
        for (const variantId of keptIds)
          await tx
            .update(productVariants)
            .set({ sku: variantId })
            .where(eq(productVariants.id, variantId));
        const rows = variants.map((variant, index) => ({
          id: variant.id ?? randomUUID(),
          productId: id,
          sku: variant.sku,
          dimensions: variant.dimensions,
          price: variant.price,
          sortOrder: index,
          isDefault: index === 0,
          active: variant.active,
          updatedAt: now,
        }));
        for (const row of rows.filter((row) => keptIds.has(row.id)))
          await tx
            .update(productVariants)
            .set(row)
            .where(eq(productVariants.id, row.id));
        const added = rows.filter((row) => !keptIds.has(row.id));
        if (added.length)
          await tx.insert(productVariants).values(added);
        if (images !== undefined) {
          const assets = images.length
            ? await tx
                .select()
                .from(mediaAssets)
                .where(
                  inArray(
                    mediaAssets.id,
                    images.map((image) => image.id),
                  ),
                )
                .for("update")
            : [];
          if (assets.length !== images.length)
            throw app.httpErrors.badRequest(
              "One or more images no longer exist. Upload them again.",
            );
          if (assets.some((asset) => asset.productId && asset.productId !== id))
            throw app.httpErrors.conflict(
              "An image is already linked to another product",
            );
          // Only gallery photos are replaced here; the room photo is handled below.
          await tx
            .update(mediaAssets)
            .set({ productId: null, isPrimary: false })
            .where(and(eq(mediaAssets.productId, id), eq(mediaAssets.kind, "gallery")));
          for (const image of images) {
            await tx
              .update(mediaAssets)
              .set({
                productId: id,
                alt: image.alt,
                isPrimary: image.isPrimary,
                kind: "gallery",
              })
              .where(eq(mediaAssets.id, image.id));
          }
        }
        // The room photo and the cutout are single photos: replace or remove them only
        // when the request mentions them.
        const linkSingle = async (
          kind: "room" | "cutout",
          value: { id: string; alt: { bs: string; en: string } } | null | undefined,
          label: string,
        ) => {
          if (value === undefined) return;
          await tx
            .update(mediaAssets)
            .set({ productId: null, kind: "gallery" })
            .where(and(eq(mediaAssets.productId, id), eq(mediaAssets.kind, kind)));
          if (!value) return;
          const [asset] = await tx
            .select()
            .from(mediaAssets)
            .where(eq(mediaAssets.id, value.id))
            .for("update");
          if (!asset || asset.kind === "showroom")
            throw app.httpErrors.badRequest(`The ${label} no longer exists. Upload it again.`);
          if (asset.productId && asset.productId !== id)
            throw app.httpErrors.conflict(`The ${label} is already linked to another product`);
          await tx
            .update(mediaAssets)
            .set({ productId: id, alt: value.alt, isPrimary: false, kind })
            .where(eq(mediaAssets.id, value.id));
        };
        await linkSingle("room", roomImage, "room photo");
        await linkSingle("cutout", cutoutImage, "cutout image");
        return saved;
      });
      return reply.code(productId ? 200 : 201).send(product);
    } catch (error) {
      const failure = error as { code?: string; cause?: { code?: string } };
      const code = failure.cause?.code ?? failure.code;
      if (code === "23505")
        return reply
          .code(409)
          .send({
            message:
              "A product or variant with this SKU already exists. Use a different SKU.",
          });
      if (code === "23503")
        return reply
          .code(400)
          .send({ message: "The selected category no longer exists" });
      throw error;
    }
  }
  app.post("/products", (request, reply) => save(request, reply));
  // Quick publish/unpublish from the product list without a full form save.
  app.patch("/products/:id/published", async (request, reply) => {
    const { id } = params.parse(request.params);
    const { published } = z.object({ published: z.boolean() }).strict().parse(request.body);
    const [updated] = await db
      .update(products)
      .set({ published, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ id: products.id, published: products.published });
    if (!updated) return reply.code(404).send({ message: "Product not found" });
    return updated;
  });
  app.put("/products/:id", (request, reply) =>
    save(request, reply, params.parse(request.params).id),
  );
};
