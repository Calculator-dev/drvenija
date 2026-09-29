import { getPublicCatalogue } from "../services/public-catalogue.js"
import { imageUrl } from "../services/backblaze.js"
import type { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { randomBytes } from "node:crypto"
import { inArray, sql, eq, and, isNotNull } from "drizzle-orm"
import { db } from "../db/client.js"
import { categories, products, customers, orders, orderItems, mediaAssets, productVariants } from "../db/schema.js"
import { sendOrderConfirmationEmail } from "../services/order-email.js"

const localeSchema = z.enum(["bs", "en"]).default("bs")

export function createOrderNumber(now = new Date()) {
  const date = now.toISOString().slice(2, 10).replaceAll("-", "")
  const suffix = randomBytes(4).toString("hex").toUpperCase()
  return `DRV-${date}-${suffix}`
}

export const publicRoutes: FastifyPluginAsync = async (app) => {
  const variantsFor = async (ids: string[]) => {
    if (ids.length === 0) return new Map<string, Array<typeof productVariants.$inferSelect>>()
    const rows = await db.select().from(productVariants).where(inArray(productVariants.productId, ids))
    const grouped = new Map<string, Array<typeof productVariants.$inferSelect>>()
    for (const row of rows) {
      const list = grouped.get(row.productId)
      if (list) list.push(row)
      else grouped.set(row.productId, [row])
    }
    return grouped
  }

  app.get("/catalogue", async (_request, reply) => {
    reply.header("Cache-Control", "no-store")
    return getPublicCatalogue()
  })
  app.get("/media/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const [asset] = await db.select().from(mediaAssets).where(and(eq(mediaAssets.id, id), isNotNull(mediaAssets.productId))).limit(1)
    if (!asset) return reply.code(404).send({ message: "Image not found" })
    reply.header("Cache-Control", "no-store")
    return reply.redirect(await imageUrl(asset.storageKey))
  })
  app.get("/categories", async (request) => {
    const locale = localeSchema.parse((request.query as { locale?: string }).locale)
    return (await db.select().from(categories)).map((category) => ({
      id: category.id,
      ...category.translations[locale],
    }))
  })

  app.get("/products", async (request) => {
    const locale = localeSchema.parse((request.query as { locale?: string }).locale)
    const rows = await db.select().from(products)
    const byProduct = await variantsFor(rows.map(product => product.id))
    return rows.map((product) => ({
      id: product.id,
      categoryId: product.categoryId,
      sku: product.sku,
      type: product.type,
      material: product.material,
      featured: product.featured,
      customizable: product.customizable,
      price: product.price,
      priceFrom: product.priceFrom,
      dimensions: product.dimensions,
      leadTime: product.leadTime[locale],
      stockLabel: product.stockLabel[locale],
      variants: (byProduct.get(product.id)?.length
        ? byProduct.get(product.id)!
        : [{
            id: `${product.id}-default`,
            productId: product.id,
            sku: product.sku,
            dimensions: product.dimensions,
            price: product.price,
            priceFrom: product.priceFrom,
            sortOrder: 0,
            isDefault: true,
            active: true,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          }]).map(variant => ({
        id: variant.id,
        sku: variant.sku,
        dimensions: variant.dimensions,
        price: variant.price,
        priceFrom: variant.priceFrom,
        isDefault: variant.isDefault,
        active: variant.active,
      })),
      ...product.translations[locale],
    }))
  })

  app.get("/products/:slug", async (request, reply) => {
    const params = z.object({ slug: z.string().min(1) }).parse(request.params)
    const locale = localeSchema.parse((request.query as { locale?: string }).locale)
    const [product] = await db.select().from(products).where(sql`${products.translations}->${locale}->>'slug' = ${params.slug}`).limit(1)

    if (!product) {
      return reply.code(404).send({ message: "Product not found" })
    }

    const rows = await db.select().from(productVariants).where(eq(productVariants.productId, product.id))

    return {
      id: product.id,
      categoryId: product.categoryId,
      sku: product.sku,
      type: product.type,
      material: product.material,
      featured: product.featured,
      customizable: product.customizable,
      price: product.price,
      priceFrom: product.priceFrom,
      dimensions: product.dimensions,
      leadTime: product.leadTime[locale],
      stockLabel: product.stockLabel[locale],
      variants: (rows.length
        ? rows
        : [{
            id: `${product.id}-default`,
            productId: product.id,
            sku: product.sku,
            dimensions: product.dimensions,
            price: product.price,
            priceFrom: product.priceFrom,
            sortOrder: 0,
            isDefault: true,
            active: true,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          }]).map(variant => ({
        id: variant.id,
        sku: variant.sku,
        dimensions: variant.dimensions,
        price: variant.price,
        priceFrom: variant.priceFrom,
        isDefault: variant.isDefault,
        active: variant.active,
      })),
      ...product.translations[locale],
    }
  })

  app.post("/orders", async (request, reply) => {
    const payload = z.object({
      locale: localeSchema,
      customer: z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
      }),
      shipping: z.object({
        address: z.string().min(3),
        city: z.string().min(2),
        postalCode: z.string().optional(),
        country: z.string().min(2),
      }),
      notes: z.string().optional(),
      items: z.array(
        z.object({
          productId: z.string().uuid(),
          variantId: z.string().uuid().optional(),
          quantity: z.number().int().positive().max(1000),
          personalization: z.string().optional(),
        }),
      ).min(1).max(100),
    }).parse(request.body)

    const orderNumber = createOrderNumber()
    const result = await db.transaction(async (tx) => {
      const selected = await tx.select().from(products).where(inArray(products.id, payload.items.map((item) => item.productId))).for("share")
      const byId = new Map(selected.map((product) => [product.id, product]))
      const variantIds = payload.items.flatMap(item => item.variantId ? [item.variantId] : [])
      const selectedVariants = variantIds.length
        ? await tx.select().from(productVariants).where(inArray(productVariants.id, variantIds)).for("share")
        : []
      const variantsById = new Map(selectedVariants.map(variant => [variant.id, variant]))
      for (const item of payload.items) {
        const product = byId.get(item.productId)
        if (!product) throw app.httpErrors.badRequest("Unknown product")
        if (item.personalization && !product.customizable) throw app.httpErrors.badRequest("Product cannot be personalized")
        if (item.variantId) {
          const variant = variantsById.get(item.variantId)
          if (!variant || variant.productId !== product.id) throw app.httpErrors.badRequest("Unknown product variant")
          if (!variant.active) throw app.httpErrors.badRequest("Selected variant is no longer available")
        }
      }
      const [customer] = await tx.insert(customers).values(payload.customer).returning()
      const [order] = await tx.insert(orders).values({
        orderNumber, locale: payload.locale, customerId: customer.id,
        shippingAddress: payload.shipping, notes: payload.notes,
      }).returning()
      await tx.insert(orderItems).values(payload.items.map((item) => ({
        ...(() => {
          const variant = item.variantId ? variantsById.get(item.variantId) : undefined
          const variantNote = variant && (variant.sku !== byId.get(item.productId)!.sku || variant.dimensions !== byId.get(item.productId)!.dimensions)
            ? `Variant: ${variant.sku} · ${variant.dimensions}`
            : ""
          const personalization = [item.personalization?.trim(), variantNote].filter(Boolean).join("\n")
          return {
            unitPrice: variant?.price ?? byId.get(item.productId)!.price,
            personalization: personalization || undefined,
          }
        })(),
        orderId: order.id, productId: item.productId, quantity: item.quantity,
      })))
      return {
        order,
        emailItems: payload.items.map(item => {
          const product = byId.get(item.productId)!
          const variant = item.variantId ? variantsById.get(item.variantId) : undefined
          return {
            name: product.translations[payload.locale]?.name ?? product.translations.bs?.name ?? product.sku,
            quantity: item.quantity,
            unitPrice: variant?.price ?? product.price,
          }
        }),
      }
    })
    const notification = await sendOrderConfirmationEmail({
      to: payload.customer.email,
      fullName: payload.customer.fullName,
      orderNumber: result.order.orderNumber,
      locale: payload.locale,
      items: result.emailItems,
      shipping: payload.shipping,
    })
    if (notification.sent) {
      try {
        await db.update(orders).set({ confirmationEmailSentAt: new Date() }).where(eq(orders.id, result.order.id))
      } catch {
        request.log.warn({ orderId: result.order.id }, "Order confirmation sent but timestamp could not be saved")
      }
    }
    return reply.code(201).send({
      ok: true,
      orderNumber: result.order.orderNumber,
      status: result.order.status,
      message: "Manual confirmation pending",
      notification,
    })
  })
}
