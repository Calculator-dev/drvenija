import type { FastifyPluginAsync } from "fastify"
import { asc, desc, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client.js"
import { levhaAyahs, levhaRequests, levhaSettings, mediaAssets } from "../db/schema.js"
import { createLevhaNumber, defaultLevhaPricing, levhaConfiguration, levhaPrice, levhaPricingInput, type LevhaPricing } from "../lib/levha.js"
import { publicFormRateLimit } from "../lib/rate-limits.js"
import { sendLevhaRequestEmails } from "../services/order-email.js"
import { withImageUrls } from "./media.js"

const params = z.object({ id: z.string().uuid() })
const text300 = z.string().trim().max(300)

export async function getLevhaPricing(): Promise<LevhaPricing> {
  const [row] = await db.select().from(levhaSettings).where(eq(levhaSettings.id, 1)).limit(1)
  return row?.pricing ?? defaultLevhaPricing
}

/** Active texts and prices for the storefront configurator (part of GET /public/catalogue). */
export async function publicLevha() {
  const [pricing, ayahs] = await Promise.all([
    getLevhaPricing(),
    db.select().from(levhaAyahs).where(eq(levhaAyahs.active, true)).orderBy(asc(levhaAyahs.sortOrder), asc(levhaAyahs.createdAt)),
  ])
  const imageIds = ayahs.flatMap(ayah => ayah.imageId ? [ayah.imageId] : [])
  const images = imageIds.length ? await db.select().from(mediaAssets).where(inArray(mediaAssets.id, imageIds)) : []
  return {
    pricing,
    ayahs: ayahs.map(ayah => {
      const image = images.find(item => item.id === ayah.imageId)
      return {
        id: ayah.id, name: ayah.name, arabic: ayah.arabic,
        image: image ? { id: image.id, url: `/public/media/${image.id}`, width: image.width, height: image.height } : null,
      }
    }),
  }
}

export const levhaRequestInput = z.object({
  locale: z.enum(["bs", "en"]).default("bs"),
  configuration: levhaConfiguration,
  customer: z.object({
    fullName: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(190),
    phone: z.string().trim().max(60).optional().transform(value => value || undefined),
  }).strict(),
  notes: z.string().trim().max(2000).optional().transform(value => value || undefined),
}).strict()

export const publicLevhaRoutes: FastifyPluginAsync = async app => {
  app.post("/levha-requests", { config: { rateLimit: publicFormRateLimit } }, async (request, reply) => {
    const input = levhaRequestInput.parse(request.body)
    const { configuration } = input
    let ayahName: string | null = null
    if (configuration.ayahId) {
      const [ayah] = await db.select().from(levhaAyahs).where(eq(levhaAyahs.id, configuration.ayahId)).limit(1)
      if (!ayah || !ayah.active) return reply.code(400).send({ message: "This text is no longer available" })
      ayahName = ayah.name[input.locale] || ayah.name.bs
    }
    // The price is always worked out here, from the saved prices.
    const pricing = await getLevhaPricing()
    if (configuration.size.width < pricing.minWidth || configuration.size.height < pricing.minHeight)
      return reply.code(400).send({ message: `The smallest levha is ${pricing.minWidth} × ${pricing.minHeight} cm` })
    const price = levhaPrice(pricing, configuration)
    let saved: { id: string; number: string } | undefined
    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
      [saved] = await db.insert(levhaRequests).values({
        number: createLevhaNumber(), locale: input.locale, configuration, ayahName, price,
        fullName: input.customer.fullName, email: input.customer.email, phone: input.customer.phone, notes: input.notes,
      }).onConflictDoNothing({ target: levhaRequests.number }).returning({ id: levhaRequests.id, number: levhaRequests.number })
    }
    if (!saved) throw new Error("Could not allocate a levha request number")
    const notification = await sendLevhaRequestEmails({ number: saved.number, locale: input.locale, configuration, ayahName, price, customer: input.customer, notes: input.notes })
    return reply.code(201).send({ ok: true, number: saved.number, price, notification })
  })
}

const ayahInput = z.object({
  name: z.object({ bs: z.string().trim().min(1).max(160), en: z.string().trim().max(160).default("") }).strict(),
  arabic: z.string().trim().min(1).max(5000),
  // A freshly uploaded image (POST /admin/media) or the current one; null removes it.
  imageId: z.string().uuid().nullable(),
  imageAlt: text300.optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100000).default(0),
}).strict()

// Registered inside the authenticated admin route scope.
export const adminLevhaRoutes: FastifyPluginAsync = async app => {
  app.get("/levha/settings", async () => ({ pricing: await getLevhaPricing() }))

  app.put("/levha/settings", async request => {
    const pricing = levhaPricingInput.parse(request.body)
    await db.insert(levhaSettings).values({ id: 1, pricing }).onConflictDoUpdate({ target: levhaSettings.id, set: { pricing, updatedAt: new Date() } })
    return { pricing }
  })

  app.get("/levha/ayahs", async () => {
    const ayahs = await db.select().from(levhaAyahs).orderBy(asc(levhaAyahs.sortOrder), asc(levhaAyahs.createdAt))
    const imageIds = ayahs.flatMap(ayah => ayah.imageId ? [ayah.imageId] : [])
    const images = imageIds.length ? await withImageUrls(await db.select().from(mediaAssets).where(inArray(mediaAssets.id, imageIds))) : []
    return ayahs.map(ayah => {
      const image = images.find(item => item.id === ayah.imageId)
      return { ...ayah, image: image ? { id: image.id, url: image.url, width: image.width, height: image.height } : null }
    })
  })

  async function saveAyah(input: z.infer<typeof ayahInput>, id?: string) {
    return db.transaction(async tx => {
      const [current] = id ? await tx.select().from(levhaAyahs).where(eq(levhaAyahs.id, id)).for("update") : []
      if (id && !current) throw app.httpErrors.notFound("Text not found")
      if (input.imageId) {
        const [asset] = await tx.select().from(mediaAssets).where(eq(mediaAssets.id, input.imageId)).for("update")
        if (!asset) throw app.httpErrors.badRequest("The calligraphy image no longer exists. Upload it again.")
        if (asset.productId || asset.kind === "showroom") throw app.httpErrors.conflict("This image is used elsewhere. Upload a separate calligraphy image.")
        await tx.update(mediaAssets).set({ kind: "calligraphy", ...(input.imageAlt !== undefined ? { alt: { bs: input.imageAlt, en: input.imageAlt } } : {}) }).where(eq(mediaAssets.id, input.imageId))
      }
      // A replaced image becomes an ordinary unlinked upload, so the media cleanup removes it.
      if (current?.imageId && current.imageId !== input.imageId)
        await tx.update(mediaAssets).set({ kind: "gallery" }).where(eq(mediaAssets.id, current.imageId))
      const values = { name: { bs: input.name.bs, en: input.name.en || input.name.bs }, arabic: input.arabic, imageId: input.imageId, active: input.active, sortOrder: input.sortOrder, updatedAt: new Date() }
      const [saved] = id
        ? await tx.update(levhaAyahs).set(values).where(eq(levhaAyahs.id, id)).returning()
        : await tx.insert(levhaAyahs).values(values).returning()
      return saved
    })
  }

  app.post("/levha/ayahs", async (request, reply) => reply.code(201).send(await saveAyah(ayahInput.parse(request.body))))
  app.put("/levha/ayahs/:id", async request => saveAyah(ayahInput.parse(request.body), params.parse(request.params).id))

  app.get("/levha/requests", async () => db
    .select({ id: levhaRequests.id, number: levhaRequests.number, fullName: levhaRequests.fullName, price: levhaRequests.price, status: levhaRequests.status, ayahName: levhaRequests.ayahName, configuration: levhaRequests.configuration, createdAt: levhaRequests.createdAt })
    .from(levhaRequests).orderBy(desc(levhaRequests.createdAt)))

  app.get("/levha/requests/:id", async (request, reply) => {
    const { id } = params.parse(request.params)
    const [row] = await db.select().from(levhaRequests).where(eq(levhaRequests.id, id)).limit(1)
    if (!row) return reply.code(404).send({ message: "Request not found" })
    return row
  })

  app.put("/levha/requests/:id", async (request, reply) => {
    const { id } = params.parse(request.params)
    const input = z.object({ status: z.enum(["new", "contacted", "accepted", "declined"]), adminNote: z.string().trim().max(5000).nullable().optional() }).strict().parse(request.body)
    const [row] = await db.update(levhaRequests).set({ status: input.status, ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}), updatedAt: new Date() }).where(eq(levhaRequests.id, id)).returning()
    if (!row) return reply.code(404).send({ message: "Request not found" })
    return row
  })
}
