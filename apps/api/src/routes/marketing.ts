import type { FastifyPluginAsync } from "fastify"
import { desc, eq, isNull } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client.js"
import { discountCodes, newsletterSubscribers, products, reviews } from "../db/schema.js"
import { normalizeCode } from "../lib/pricing.js"

const params = z.object({ id: z.string().uuid() })
const optionalDate = z.string().datetime({ offset: true }).nullable().optional().transform(value => value ? new Date(value) : null)

export const discountInput = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, dashes or underscores").transform(normalizeCode),
  kind: z.enum(["percent", "fixed"]),
  value: z.number().int().min(1).max(100000),
  minSubtotal: z.number().int().min(0).max(1000000).default(0),
  startsAt: optionalDate,
  endsAt: optionalDate,
  maxUses: z.number().int().min(1).max(1000000).nullable().optional().transform(value => value ?? null),
  active: z.boolean().default(true),
}).strict()
  .refine(value => value.kind !== "percent" || value.value <= 100, { message: "A percentage cannot exceed 100", path: ["value"] })
  .refine(value => !value.startsAt || !value.endsAt || value.startsAt < value.endsAt, { message: "The end must be after the start", path: ["endsAt"] })

const duplicate = (error: unknown) => {
  const failure = error as { code?: string; cause?: { code?: string } }
  return (failure.cause?.code ?? failure.code) === "23505"
}

// Registered inside the authenticated admin route scope.
export const marketingRoutes: FastifyPluginAsync = async app => {
  app.get("/discounts", async () => db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt)))

  app.post("/discounts", async (request, reply) => {
    const input = discountInput.parse(request.body)
    try {
      const [created] = await db.insert(discountCodes).values(input).returning()
      return reply.code(201).send(created)
    } catch (error) {
      if (duplicate(error)) return reply.code(409).send({ message: "A discount code with this name already exists" })
      throw error
    }
  })

  app.put("/discounts/:id", async (request, reply) => {
    const { id } = params.parse(request.params)
    const input = discountInput.parse(request.body)
    try {
      const [updated] = await db.update(discountCodes).set(input).where(eq(discountCodes.id, id)).returning()
      if (!updated) return reply.code(404).send({ message: "Discount code not found" })
      return updated
    } catch (error) {
      if (duplicate(error)) return reply.code(409).send({ message: "A discount code with this name already exists" })
      throw error
    }
  })

  // Orders keep the code text they used, so deleting a code does not change past orders.
  app.delete("/discounts/:id", async (request, reply) => {
    const { id } = params.parse(request.params)
    const [deleted] = await db.delete(discountCodes).where(eq(discountCodes.id, id)).returning({ id: discountCodes.id })
    if (!deleted) return reply.code(404).send({ message: "Discount code not found" })
    return reply.code(204).send()
  })

  app.get("/reviews", async () => {
    const rows = await db
      .select({ review: reviews, productTranslations: products.translations, sku: products.sku })
      .from(reviews).innerJoin(products, eq(products.id, reviews.productId))
      .orderBy(desc(reviews.createdAt))
    return rows.map(({ review, productTranslations, sku }) => ({ ...review, productName: productTranslations.bs?.name ?? sku }))
  })

  app.put("/reviews/:id", async (request, reply) => {
    const { id } = params.parse(request.params)
    const { status } = z.object({ status: z.enum(["approved", "rejected", "pending"]) }).strict().parse(request.body)
    const [updated] = await db.update(reviews).set({ status, reviewedAt: status === "pending" ? null : new Date() }).where(eq(reviews.id, id)).returning()
    if (!updated) return reply.code(404).send({ message: "Review not found" })
    return updated
  })

  app.get("/newsletter", async () => db
    .select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email, locale: newsletterSubscribers.locale, createdAt: newsletterSubscribers.createdAt })
    .from(newsletterSubscribers).where(isNull(newsletterSubscribers.unsubscribedAt))
    .orderBy(desc(newsletterSubscribers.createdAt)))
}
