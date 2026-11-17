import type { FastifyPluginAsync } from "fastify"
import { and, eq, isNull, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client.js"
import { customers, discountCodes, newsletterSubscribers, orderItems, orders, products, reviews } from "../db/schema.js"
import { discountFor, discountProblem, normalizeCode } from "../lib/pricing.js"
import { publicFormRateLimit } from "../lib/rate-limits.js"

// Looking up an order or a code is cheap but must not allow guessing at scale.
const lookupRateLimit = { max: 30, timeWindow: "10 minutes" }
const locale = z.enum(["bs", "en"]).default("bs")
const orderNumber = z.string().trim().toUpperCase().regex(/^DRV-\d{6}-[A-F0-9]{8}$/)
const email = z.string().trim().email().max(190)

/** Statuses after which the customer has the product and can review it. */
export const reviewableStatuses = ["shipped", "completed"] as const

async function findCustomerOrder(number: string, address: string) {
  const [order] = await db
    .select({ order: orders, customerEmail: customers.email })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(eq(orders.orderNumber, number), sql`lower(${customers.email}) = lower(${address})`))
    .limit(1)
  return order?.order
}

export const publicCustomerRoutes: FastifyPluginAsync = async app => {
  // Preview only: POST /public/orders checks the code again and records its use.
  app.post("/discounts/check", { config: { rateLimit: lookupRateLimit } }, async (request, reply) => {
    const input = z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().int().min(0).max(10_000_000) }).parse(request.body)
    const [code] = await db.select().from(discountCodes).where(eq(discountCodes.code, normalizeCode(input.code))).limit(1)
    if (!code) return reply.code(404).send({ valid: false, reason: "not_found" })
    const problem = discountProblem(code, input.subtotal)
    if (problem) return reply.code(422).send({ valid: false, reason: problem, minSubtotal: code.minSubtotal })
    return { valid: true, code: code.code, kind: code.kind, value: code.value, minSubtotal: code.minSubtotal, amount: discountFor(code, input.subtotal) }
  })

  // The order number alone is not enough: the customer's email must match too.
  app.post("/orders/lookup", { config: { rateLimit: lookupRateLimit } }, async (request, reply) => {
    const input = z.object({ orderNumber, email, locale }).parse(request.body)
    const order = await findCustomerOrder(input.orderNumber, input.email)
    if (!order) return reply.code(404).send({ message: "Order not found" })
    const [items, submitted] = await Promise.all([
      db.select({ productId: orderItems.productId, quantity: orderItems.quantity, unitPrice: orderItems.unitPrice, personalization: orderItems.personalization, translations: products.translations, sku: products.sku })
        .from(orderItems).innerJoin(products, eq(products.id, orderItems.productId)).where(eq(orderItems.orderId, order.id)),
      db.select({ productId: reviews.productId }).from(reviews).where(eq(reviews.orderId, order.id)),
    ])
    const reviewed = new Set(submitted.map(row => row.productId))
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const canReview = (reviewableStatuses as readonly string[]).includes(order.status)
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
      declineReason: order.declineReason,
      items: items.map(item => {
        const translation = item.translations[input.locale] ?? item.translations.bs
        return {
          productId: item.productId, name: translation?.name ?? item.sku, slug: translation?.slug ?? "",
          quantity: item.quantity, unitPrice: item.unitPrice, personalization: item.personalization,
          canReview: canReview && !reviewed.has(item.productId), reviewed: reviewed.has(item.productId),
        }
      }),
      subtotal,
      discountAmount: order.discountAmount,
      shippingAmount: order.shippingAmount,
      giftWrapAmount: order.giftWrapAmount,
      total: subtotal - order.discountAmount + order.shippingAmount + order.giftWrapAmount,
    }
  })

  app.post("/reviews", { config: { rateLimit: publicFormRateLimit } }, async (request, reply) => {
    const input = z.object({
      orderNumber, email, locale,
      productId: z.string().uuid(),
      authorName: z.string().trim().min(2).max(80),
      rating: z.number().int().min(1).max(5),
      body: z.string().trim().min(10).max(2000),
    }).parse(request.body)
    const order = await findCustomerOrder(input.orderNumber, input.email)
    if (!order) return reply.code(404).send({ message: "Order not found" })
    if (!(reviewableStatuses as readonly string[]).includes(order.status)) return reply.code(409).send({ message: "Reviews open once the order has shipped" })
    const [item] = await db.select({ id: orderItems.id }).from(orderItems).where(and(eq(orderItems.orderId, order.id), eq(orderItems.productId, input.productId))).limit(1)
    if (!item) return reply.code(400).send({ message: "This product is not part of the order" })
    const [review] = await db.insert(reviews).values({
      productId: input.productId, orderId: order.id, authorName: input.authorName,
      rating: input.rating, body: input.body, locale: input.locale,
    }).onConflictDoNothing().returning({ id: reviews.id })
    if (!review) return reply.code(409).send({ message: "This product has already been reviewed for this order" })
    return reply.code(201).send({ ok: true, status: "pending" })
  })

  app.post("/newsletter", { config: { rateLimit: publicFormRateLimit } }, async (request, reply) => {
    const input = z.object({ email, locale, consent: z.literal(true) }).parse(request.body)
    // Subscribing again after unsubscribing re-activates the address.
    await db.insert(newsletterSubscribers).values({ email: input.email.toLowerCase(), locale: input.locale })
      .onConflictDoUpdate({ target: newsletterSubscribers.email, set: { unsubscribedAt: null, locale: input.locale } })
    return reply.code(201).send({ ok: true })
  })

  app.post("/newsletter/unsubscribe", { config: { rateLimit: lookupRateLimit } }, async request => {
    const { token } = z.object({ token: z.string().uuid() }).parse(request.body)
    await db.update(newsletterSubscribers).set({ unsubscribedAt: new Date() })
      .where(and(eq(newsletterSubscribers.token, token), isNull(newsletterSubscribers.unsubscribedAt)))
    // Same answer whether or not the token existed.
    return { ok: true }
  })
}
