import type { FastifyPluginAsync } from "fastify"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client.js"
import { mediaAssets, showroomSettings } from "../db/schema.js"
import { withImageUrls } from "./media.js"

const percent = z.number().min(0).max(100)

export const showroomInput = z.object({
  // A freshly uploaded photo (POST /admin/media) or the current showroom photo; null removes it.
  imageId: z.string().uuid().nullable(),
  artArea: z.object({ x: percent, y: percent, width: z.number().min(2).max(100), height: z.number().min(2).max(100) }).strict()
    .refine(area => area.x + area.width <= 100.001 && area.y + area.height <= 100.001, "The artwork area must stay inside the photo"),
  wallOutline: z.array(z.tuple([percent, percent])).min(3).max(60),
  areaWidthCm: z.number().int().min(20).max(1000),
}).strict()

export type ShowroomInput = z.infer<typeof showroomInput>

// Registered inside the authenticated admin route scope.
export const showroomRoutes: FastifyPluginAsync = async app => {
  app.get("/showroom", async () => {
    const [settings] = await db.select().from(showroomSettings).where(eq(showroomSettings.id, 1)).limit(1)
    if (!settings) return null
    const [image] = settings.imageId ? await db.select().from(mediaAssets).where(eq(mediaAssets.id, settings.imageId)).limit(1) : []
    const [withUrl] = image ? await withImageUrls([image]) : []
    return {
      image: withUrl ? { id: withUrl.id, url: withUrl.url, width: withUrl.width, height: withUrl.height } : null,
      artArea: settings.artArea,
      wallOutline: settings.wallOutline,
      areaWidthCm: settings.areaWidthCm,
      updatedAt: settings.updatedAt,
    }
  })

  app.put("/showroom", async request => {
    const input = showroomInput.parse(request.body)
    await db.transaction(async tx => {
      const [current] = await tx.select().from(showroomSettings).where(eq(showroomSettings.id, 1)).for("update")
      if (input.imageId) {
        const [asset] = await tx.select().from(mediaAssets).where(eq(mediaAssets.id, input.imageId)).for("update")
        if (!asset) throw app.httpErrors.badRequest("The showroom photo no longer exists. Upload it again.")
        if (asset.productId) throw app.httpErrors.conflict("This photo belongs to a product. Upload a separate showroom photo.")
        await tx.update(mediaAssets).set({ kind: "showroom" }).where(eq(mediaAssets.id, asset.id))
      }
      // A replaced photo becomes an ordinary unlinked upload, so the media cleanup removes it.
      if (current?.imageId && current.imageId !== input.imageId)
        await tx.update(mediaAssets).set({ kind: "gallery" }).where(eq(mediaAssets.id, current.imageId))
      const values = { imageId: input.imageId, artArea: input.artArea, wallOutline: input.wallOutline, areaWidthCm: input.areaWidthCm, updatedAt: new Date() }
      await tx.insert(showroomSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: showroomSettings.id, set: values })
    })
    return { ok: true }
  })
}

/** The showroom for the public catalogue, or null when no photo is set. */
export async function publicShowroom() {
  const [settings] = await db.select().from(showroomSettings).where(eq(showroomSettings.id, 1)).limit(1)
  if (!settings?.imageId) return null
  const [image] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, settings.imageId)).limit(1)
  if (!image) return null
  return {
    image: { id: image.id, url: `/public/media/${image.id}`, width: image.width, height: image.height },
    artArea: settings.artArea,
    wallOutline: settings.wallOutline,
    areaWidthCm: settings.areaWidthCm,
  }
}
