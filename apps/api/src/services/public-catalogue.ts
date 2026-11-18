import { db } from "../db/client.js"
import { categories, products, mediaAssets, productVariants, reviews } from "../db/schema.js"
import { and, asc, desc, eq, isNotNull } from "drizzle-orm"
import { shippingPolicy } from "../lib/shipping.js"
import { giftWrapPrice } from "../lib/pricing.js"
import { publicShowroom } from "../routes/showroom.js"
import { publicVariants } from "../lib/variants.js"

function localized(rows: Record<string, Record<string, string>>, field: string) {
  return { bs: rows.bs?.[field] ?? "", en: rows.en?.[field] || rows.bs?.[field] || "" }
}
function publicImage(image: typeof mediaAssets.$inferSelect, row: typeof products.$inferSelect) {
  return {
    id: image.id, url: `/public/media/${image.id}`, width: image.width, height: image.height,
    alt: { bs: image.alt.bs || row.translations.bs?.name || "", en: image.alt.en || image.alt.bs || row.translations.en?.name || row.translations.bs?.name || "" },
    mimeType: image.mimeType, storageKey: "",
  }
}

const nonGallery = new Set<string>(["room", "cutout", "showroom"])

function single(images: (typeof mediaAssets.$inferSelect)[], row: typeof products.$inferSelect, kind: "room" | "cutout") {
  const image = images.find(item => item.productId === row.id && item.kind === kind)
  return image ? publicImage(image, row) : null
}

export function catalogueResponse(
  categoryRows: (typeof categories.$inferSelect)[],
  productRows: (typeof products.$inferSelect)[],
  images: (typeof mediaAssets.$inferSelect)[],
  variantRows: (typeof productVariants.$inferSelect)[] = [],
  reviewRows: Array<Pick<typeof reviews.$inferSelect, "id" | "productId" | "authorName" | "rating" | "body" | "locale" | "createdAt">> = [],
  showroom: Awaited<ReturnType<typeof publicShowroom>> = null,
) {
  const reviewsByProduct = new Map<string, typeof reviewRows>()
  for (const review of reviewRows) {
    const group = reviewsByProduct.get(review.productId)
    if (group) group.push(review)
    else reviewsByProduct.set(review.productId, [review])
  }
  const categoryNames = new Map(categoryRows.map(row => [row.id, localized(row.translations, "name")]))
  const variantsByProduct = new Map<string, Array<typeof productVariants.$inferSelect>>()
  for (const variant of variantRows) {
    const group = variantsByProduct.get(variant.productId)
    if (group) group.push(variant)
    else variantsByProduct.set(variant.productId, [variant])
  }
  return {
    shipping: shippingPolicy,
    showroom,
    checkout: { giftWrapPrice, paymentMethods: ["bank_transfer", "cash_on_delivery"] as const },
    categories: categoryRows.map(row => ({ id: row.id, name: localized(row.translations, "name"), slug: localized(row.translations, "slug"), description: localized(row.translations, "description"), seo: { title: localized(row.seo, "title"), description: localized(row.seo, "description") } })),
    products: productRows.filter(row => row.published !== false).map(row => {
      const productReviews = reviewsByProduct.get(row.id) ?? []
      return {
      rating: productReviews.length
        ? { average: Math.round(productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length * 10) / 10, count: productReviews.length }
        : null,
      // Newest approved reviews; the rating above counts all of them.
      reviews: productReviews.slice(0, 12).map(review => ({ id: review.id, authorName: review.authorName, rating: review.rating, body: review.body, locale: review.locale, createdAt: review.createdAt })),
      variants: publicVariants(row, variantsByProduct.get(row.id)),
      id: row.id, sku: row.sku, categoryId: row.categoryId, categoryName: categoryNames.get(row.categoryId) ?? { bs: "", en: "" },
      type: row.type, material: row.material, featured: row.featured, customizable: row.customizable,
      price: row.price, currency: "BAM" as const, dimensions: row.dimensions,
      leadTime: row.leadTime, stockLabel: row.stockLabel,
      ...Object.fromEntries(["name", "slug", "tagline", "shortDescription", "description"].map(field => [field, localized(row.translations, field)])),
      seo: { title: localized(row.seo, "title"), description: localized(row.seo, "description") },
      media: images.filter(image => image.productId === row.id && !nonGallery.has(image.kind)).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)).map(image => publicImage(image, row)),
      roomImage: single(images, row, "room"),
      cutoutImage: single(images, row, "cutout"),
    }
    }),
  }
}
export async function getPublicCatalogue() {
  const [categoryRows, productRows, images, variantRows, reviewRows, showroom] = await Promise.all([
    db.select().from(categories).orderBy(categories.code),
    db.select().from(products).orderBy(desc(products.createdAt)),
    db.select().from(mediaAssets).where(isNotNull(mediaAssets.productId)).orderBy(mediaAssets.createdAt),
    db.select().from(productVariants).orderBy(productVariants.productId, asc(productVariants.sortOrder), productVariants.createdAt),
    db.select({ id: reviews.id, productId: reviews.productId, authorName: reviews.authorName, rating: reviews.rating, body: reviews.body, locale: reviews.locale, createdAt: reviews.createdAt })
      .from(reviews).where(and(eq(reviews.status, "approved"))).orderBy(desc(reviews.createdAt)),
    publicShowroom(),
  ])
  return catalogueResponse(categoryRows, productRows, images, variantRows, reviewRows, showroom)
}
