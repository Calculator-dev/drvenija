import { getPublicCatalogue } from "../services/public-catalogue.js"
import { imageUrl } from "../services/backblaze.js"
import type { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { randomBytes } from "node:crypto"
import { inArray, sql, eq, and, isNotNull, or } from "drizzle-orm"
import { db } from "../db/client.js"
import { categories, products, customers, orders, orderItems, mediaAssets, productVariants, discountCodes } from "../db/schema.js"
import { sendOrderConfirmationEmail } from "../services/order-email.js"
import { discountFor, discountProblem, normalizeCode, orderTotals } from "../lib/pricing.js"
import { publicVariants } from "../lib/variants.js"
import { publicInquiryRoutes } from "./inquiries.js"
import { publicCustomerRoutes } from "./customer.js"
import { publicFormRateLimit } from "../lib/rate-limits.js"

const localeSchema = z.enum(["bs", "en"]).default("bs")

export function createOrderNumber(now = new Date()) {
  const date = now.toISOString().slice(2, 10).replaceAll("-", "")
  const suffix = randomBytes(4).toString("hex").toUpperCase()
  return `DRV-${date}-${suffix}`
}

export const publicRoutes: FastifyPluginAsync = async (app) => {
  app.register(publicInquiryRoutes)
  app.register(publicCustomerRoutes)
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
    const [asset] = await db.select().from(mediaAssets).where(and(eq(mediaAssets.id, id), or(isNotNull(mediaAssets.productId), eq(mediaAssets.kind, "showroom")))).limit(1)
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
    const rows = await db.select().from(products).where(eq(products.published, true))
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
      dimensions: product.dimensions,
      leadTime: product.leadTime[locale],
      stockLabel: product.stockLabel[locale],
      variants: publicVariants(product, byProduct.get(product.id)),
      ...product.translations[locale],
    }))
  })

  app.get("/products/:slug", async (request, reply) => {
    const params = z.object({ slug: z.string().min(1) }).parse(request.params)
    const locale = localeSchema.parse((request.query as { locale?: string }).locale)
    const [product] = await db.select().from(products).where(and(eq(products.published, true), sql`${products.translations}->${locale}->>'slug' = ${params.slug}`)).limit(1)

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
      dimensions: product.dimensions,
      leadTime: product.leadTime[locale],
      stockLabel: product.stockLabel[locale],
      variants: publicVariants(product, rows),
      ...product.translations[locale],
    }
  })

  app.post("/orders", { config: { rateLimit: publicFormRateLimit } }, async (request, reply) => {
    // Limits mirror the database column sizes so oversized input is a 400, not a 500.
    const payload = z.object({
      locale: localeSchema,
      customer: z.object({
        fullName: z.string().trim().min(2).max(160),
        email: z.string().trim().email().max(190),
        phone: z.string().trim().max(60).optional(),
      }),
      shipping: z.object({
        address: z.string().trim().min(3).max(300),
        city: z.string().trim().min(2).max(120),
        postalCode: z.string().trim().max(20).optional(),
        country: z.string().trim().min(2).max(80),
      }),
      notes: z.string().trim().max(2000).optional(),
      paymentMethod: z.enum(["bank_transfer", "cash_on_delivery"]).default("bank_transfer"),
      giftWrap: z.boolean().default(false),
      giftMessage: z.string().trim().max(300).optional().transform(value => value || undefined),
      discountCode: z.string().trim().max(40).optional().transform(value => value ? normalizeCode(value) : undefined),
      items: z.array(
        z.object({
          productId: z.string().uuid(),
          variantId: z.string().uuid().optional(),
          quantity: z.number().int().positive().max(1000),
          personalization: z.string().trim().max(500).optional(),
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
      const lines = payload.items.map(item => {
        const product = byId.get(item.productId)
        if (!product || product.published === false) throw app.httpErrors.badRequest("Unknown product")
        if (item.personalization && !product.customizable) throw app.httpErrors.badRequest("Product cannot be personalized")
        const variant = item.variantId ? variantsById.get(item.variantId) : undefined
        if (item.variantId) {
          if (!variant || variant.productId !== product.id) throw app.httpErrors.badRequest("Unknown product variant")
          if (!variant.active) throw app.httpErrors.badRequest("Selected variant is no longer available")
        }
        const variantNote = variant && (variant.sku !== product.sku || variant.dimensions !== product.dimensions)
          ? `Variant: ${variant.sku} · ${variant.dimensions}`
          : ""
        return {
          item,
          product,
          unitPrice: variant?.price ?? product.price,
          personalization: [item.personalization, variantNote].filter(Boolean).join("\n") || undefined,
        }
      })
      const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.item.quantity, 0)
      let discount = 0
      if (payload.discountCode) {
        // Count the use in the same statement that checks the limit, so two orders
        // cannot both take the last use of a code.
        const [code] = await tx.select().from(discountCodes).where(eq(discountCodes.code, payload.discountCode)).for("update")
        if (!code || discountProblem(code, subtotal)) throw app.httpErrors.badRequest("Discount code cannot be used")
        await tx.update(discountCodes).set({ usedCount: sql`${discountCodes.usedCount} + 1` }).where(eq(discountCodes.id, code.id))
        discount = discountFor(code, subtotal)
      }
      const totals = orderTotals({ subtotal, discount, giftWrap: payload.giftWrap })
      const [customer] = await tx.insert(customers).values(payload.customer).returning()
      const [order] = await tx.insert(orders).values({
        orderNumber, locale: payload.locale, customerId: customer.id,
        shippingAddress: payload.shipping, notes: payload.notes, shippingAmount: totals.shippingAmount,
        paymentMethod: payload.paymentMethod, giftWrap: payload.giftWrap, giftWrapAmount: totals.giftWrapAmount,
        giftMessage: payload.giftWrap ? payload.giftMessage : undefined,
        discountCode: discount > 0 ? payload.discountCode : undefined, discountAmount: totals.discountAmount,
      }).returning()
      await tx.insert(orderItems).values(lines.map(line => ({
        orderId: order.id, productId: line.item.productId, quantity: line.item.quantity,
        unitPrice: line.unitPrice, personalization: line.personalization,
      })))
      return {
        order,
        totals,
        emailItems: lines.map(line => ({
          name: line.product.translations[payload.locale]?.name ?? line.product.translations.bs?.name ?? line.product.sku,
          quantity: line.item.quantity,
          unitPrice: line.unitPrice,
        })),
      }
    })
    const notification = await sendOrderConfirmationEmail({
      to: payload.customer.email,
      fullName: payload.customer.fullName,
      orderNumber: result.order.orderNumber,
      locale: payload.locale,
      items: result.emailItems,
      totals: result.totals,
      paymentMethod: payload.paymentMethod,
      giftMessage: payload.giftWrap ? payload.giftMessage : undefined,
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
      subtotal: result.totals.subtotal,
      discountAmount: result.totals.discountAmount,
      shippingAmount: result.totals.shippingAmount,
      giftWrapAmount: result.totals.giftWrapAmount,
      total: result.totals.total,
      message: "Manual confirmation pending",
      notification,
    })
  })
}
