import type { FastifyPluginAsync } from "fastify"
import { and, desc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client.js"
import { customers, orderItems, orders, products } from "../db/schema.js"
import { sendOrderDecisionEmail, sendOrderStatusEmail, type FulfilmentStatus } from "../services/order-email.js"

const params = z.object({ id: z.string().uuid() })
/** Fulfilment steps after acceptance, in order. An order can only move forward. */
export const fulfilmentSteps = ["confirmed", "in_production", "packed", "shipped", "completed"] as const
const statusInput = z.object({
  status: z.enum(["in_production", "packed", "shipped", "completed"]),
  trackingNumber: z.string().trim().max(120).optional().transform(value => value || undefined),
  notify: z.boolean().default(true),
}).strict()
const paymentInput = z.object({ paymentStatus: z.enum(["pending_manual", "paid"]) }).strict()

const decisionInput = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("accept") }),
  z.object({ decision: z.literal("decline"), reason: z.string().trim().min(5).max(2000) }),
])
const totalAmount = sql<number>`coalesce(sum(${orderItems.unitPrice} * ${orderItems.quantity}), 0) - ${orders.discountAmount} + ${orders.shippingAmount} + ${orders.giftWrapAmount}`.mapWith(Number)

export function orderSummaries() {
  return db
    .select({
      id: orders.id, orderNumber: orders.orderNumber, customer: customers.fullName,
      status: orders.status, paymentStatus: orders.paymentStatus, paymentMethod: orders.paymentMethod,
      amount: totalAmount, createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .groupBy(orders.id, customers.id)
    .orderBy(desc(orders.createdAt))
}

export const orderReviewRoutes: FastifyPluginAsync = async app => {
  app.get("/orders", async () => orderSummaries())

  app.get("/orders/:id", async (request, reply) => {
    const { id } = params.parse(request.params)
    const [order] = await db
      .select({
        id: orders.id, orderNumber: orders.orderNumber, locale: orders.locale,
        status: orders.status, paymentStatus: orders.paymentStatus,
        shippingAddress: orders.shippingAddress, notes: orders.notes,
        shippingAmount: orders.shippingAmount,
        paymentMethod: orders.paymentMethod, giftWrap: orders.giftWrap, giftWrapAmount: orders.giftWrapAmount,
        giftMessage: orders.giftMessage, discountCode: orders.discountCode, discountAmount: orders.discountAmount,
        trackingNumber: orders.trackingNumber, statusEmailSentAt: orders.statusEmailSentAt, updatedAt: orders.updatedAt,
        declineReason: orders.declineReason, reviewedAt: orders.reviewedAt,
        reviewEmailSentAt: orders.reviewEmailSentAt, confirmationEmailSentAt: orders.confirmationEmailSentAt,
        createdAt: orders.createdAt,
        customer: { fullName: customers.fullName, email: customers.email, phone: customers.phone },
      })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(eq(orders.id, id))
      .limit(1)
    if (!order) return reply.code(404).send({ message: "Order not found" })

    const items = await db
      .select({
        id: orderItems.id, productId: orderItems.productId, sku: products.sku,
        translations: products.translations, quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice, personalization: orderItems.personalization,
      })
      .from(orderItems)
      .innerJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orderItems.orderId, id))

    return {
      ...order,
      items: items.map(item => ({
        id: item.id, productId: item.productId, sku: item.sku,
        name: item.translations[order.locale]?.name ?? item.translations.bs?.name ?? item.sku,
        quantity: item.quantity, unitPrice: item.unitPrice, personalization: item.personalization,
      })),
      subtotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      amount: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) - order.discountAmount + order.shippingAmount + order.giftWrapAmount,
    }
  })

  app.put("/orders/:id/decision", async (request, reply) => {
    const { id } = params.parse(request.params)
    const input = decisionInput.parse(request.body)
    const [existing] = await db
      .select({
        id: orders.id, orderNumber: orders.orderNumber, locale: orders.locale,
        status: orders.status, email: customers.email, fullName: customers.fullName,
      })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(eq(orders.id, id))
      .limit(1)
    if (!existing) return reply.code(404).send({ message: "Order not found" })
    if (existing.status !== "submitted") return reply.code(409).send({ message: "Order has already been reviewed" })

    const now = new Date()
    const [updated] = await db.update(orders).set({
      status: input.decision === "accept" ? "confirmed" : "declined",
      paymentStatus: input.decision === "decline" ? "cancelled" : "pending_manual",
      declineReason: input.decision === "decline" ? input.reason : null,
      reviewedAt: now, updatedAt: now,
    }).where(and(eq(orders.id, id), eq(orders.status, "submitted"))).returning()
    if (!updated) return reply.code(409).send({ message: "Order has already been reviewed" })

    const email = await sendOrderDecisionEmail({
      to: existing.email, fullName: existing.fullName, orderNumber: existing.orderNumber,
      locale: existing.locale, decision: input.decision,
      reason: input.decision === "decline" ? input.reason : undefined,
    })
    if (email.sent) {
      const sentAt = new Date()
      await db.update(orders).set({ reviewEmailSentAt: sentAt }).where(eq(orders.id, id))
      updated.reviewEmailSentAt = sentAt
    }
    return { order: updated, notification: email }
  })

  app.put("/orders/:id/status", async (request, reply) => {
    const { id } = params.parse(request.params)
    const input = statusInput.parse(request.body)
    const [existing] = await db
      .select({ status: orders.status, orderNumber: orders.orderNumber, locale: orders.locale, trackingNumber: orders.trackingNumber, email: customers.email, fullName: customers.fullName })
      .from(orders).innerJoin(customers, eq(customers.id, orders.customerId)).where(eq(orders.id, id)).limit(1)
    if (!existing) return reply.code(404).send({ message: "Order not found" })
    const from = fulfilmentSteps.indexOf(existing.status as (typeof fulfilmentSteps)[number])
    const to = fulfilmentSteps.indexOf(input.status)
    if (from < 0) return reply.code(409).send({ message: "Only accepted orders can move through production" })
    if (to <= from) return reply.code(409).send({ message: "An order can only move forward" })

    const trackingNumber = input.trackingNumber ?? existing.trackingNumber
    const [updated] = await db.update(orders).set({ status: input.status, trackingNumber, updatedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.status, existing.status))).returning()
    if (!updated) return reply.code(409).send({ message: "The order changed meanwhile. Reload and try again." })

    if (!input.notify) return { order: updated, notification: null }
    const email = await sendOrderStatusEmail({
      to: existing.email, fullName: existing.fullName, orderNumber: existing.orderNumber,
      locale: existing.locale, status: input.status as FulfilmentStatus, trackingNumber,
    })
    if (email.sent) {
      const sentAt = new Date()
      await db.update(orders).set({ statusEmailSentAt: sentAt }).where(eq(orders.id, id))
      updated.statusEmailSentAt = sentAt
    }
    return { order: updated, notification: email }
  })

  app.put("/orders/:id/payment", async (request, reply) => {
    const { id } = params.parse(request.params)
    const input = paymentInput.parse(request.body)
    const [updated] = await db.update(orders).set({ paymentStatus: input.paymentStatus, updatedAt: new Date() })
      .where(and(eq(orders.id, id), sql`${orders.status} <> 'declined'`)).returning()
    if (!updated) return reply.code(404).send({ message: "Order not found or declined" })
    return { order: updated }
  })
}
