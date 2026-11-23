import type { FastifyPluginAsync } from "fastify"
import { count, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "../db/client.js"
import { inquiries, levhaRequests, orders, products, reviews } from "../db/schema.js"
import { orderSummaries } from "./order-review.js"

// Start of the current day in the shop's time zone.
const startOfShopDay = sql`date_trunc('day', now() at time zone 'Europe/Sarajevo') at time zone 'Europe/Sarajevo'`

export const dashboardRoutes: FastifyPluginAsync = async app => {
  app.get("/dashboard", async () => {
    const [[today], [awaiting], [queued], [recentInquiries], [catalogue], [pendingReviews], [newLevha], recentOrders] = await Promise.all([
      db.select({ value: count() }).from(orders).where(gte(orders.createdAt, startOfShopDay)),
      db.select({ value: count() }).from(orders).where(inArray(orders.status, ["submitted"])),
      db.select({ value: count() }).from(orders).where(inArray(orders.status, ["confirmed", "in_production", "packed"])),
      db.select({ value: count() }).from(inquiries).where(gte(inquiries.createdAt, sql`now() - interval '30 days'`)),
      db.select({ value: count() }).from(products),
      db.select({ value: count() }).from(reviews).where(eq(reviews.status, "pending")),
      db.select({ value: count() }).from(levhaRequests).where(eq(levhaRequests.status, "new")),
      orderSummaries().limit(5),
    ])
    return {
      totals: {
        ordersToday: today.value,
        awaitingReview: awaiting.value,
        productionQueued: queued.value,
        inquiriesLast30Days: recentInquiries.value,
        productsActive: catalogue.value,
        reviewsPending: pendingReviews.value,
        levhaRequestsNew: newLevha.value,
      },
      recentOrders,
    }
  })
}
