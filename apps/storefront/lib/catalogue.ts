import "server-only"
import { connection } from "next/server"
import { cache } from "react"
import { serverApiUrl } from "./api-url"
import { defaultShowroom, type ShowroomConfig } from "./showroom"
import type { LevhaCatalogue } from "./levha"
import { activeVariants, defaultCheckoutSettings, defaultShippingPolicy, type CheckoutSettings, localizeCategory, localizeProduct, type CatalogueOffer, type Category, type Product, type Locale, type ShippingPolicy } from "./products"

type Catalogue = { products: Product[]; categories: Category[]; shipping: ShippingPolicy; checkout: CheckoutSettings; showroom: (Omit<ShowroomConfig, "image"> & { image: ShowroomConfig["image"] & { id: string } }) | null; levha: LevhaCatalogue | null }

const mediaUrl = <T extends { id: string }>(image: T) => ({ ...image, url: `/api/media/${image.id}` })

// cache() deduplicates the fetch within one request (metadata, page, related products).
export const getCatalogue = cache(async (): Promise<Catalogue> => {
  // The catalogue is always read at request time so CRM changes appear immediately.
  await connection()
  const response = await fetch(`${serverApiUrl()}/public/catalogue`, { cache: "no-store", signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error("The product catalogue is temporarily unavailable")
  const data = await response.json() as Catalogue
  return { ...data, shipping: data.shipping ?? defaultShippingPolicy, checkout: data.checkout ?? defaultCheckoutSettings, showroom: data.showroom ? { ...data.showroom, image: mediaUrl(data.showroom.image) } : null, levha: data.levha ? { ...data.levha, ayahs: data.levha.ayahs.map(ayah => ({ ...ayah, image: ayah.image ? mediaUrl(ayah.image) : null })) } : null, products: data.products.map(product => ({ ...product, media: product.media.map(mediaUrl), cutoutImage: product.cutoutImage ? mediaUrl(product.cutoutImage) : null })) }
})
export async function getCartOffers(): Promise<{ offers: CatalogueOffer[]; shipping: ShippingPolicy }> {
  const { products, shipping } = await getCatalogue()
  return {
    shipping,
    offers: products.map(product => ({
      productId: product.id,
      variants: activeVariants(product).map(({ id, sku, dimensions, price, isDefault }) => ({ id, sku, dimensions, price, isDefault })),
    })),
  }
}
export async function getProducts(locale: Locale) {
  return (await getCatalogue()).products.map(product => localizeProduct(product, locale))
}
export async function getCategories(locale: Locale) {
  return (await getCatalogue()).categories.map(category => localizeCategory(category, locale))
}
export async function getCategoryBySlug(locale: Locale, slug: string) {
  return (await getCategories(locale)).find(category => category.localizedSlug === slug || category.slug.bs === slug || category.slug.en === slug) ?? null
}
export async function getProductBySlug(locale: Locale, slug: string) {
  return (await getProducts(locale)).find(product => product.localizedSlug === slug || product.slug.bs === slug || product.slug.en === slug) ?? null
}
/** Products from the same category first, topped up with bestsellers so the row is full. */
export async function getRelatedProducts(locale: Locale, productId: string, limit = 4) {
  const products = await getProducts(locale)
  const current = products.find(product => product.id === productId)
  if (!current) return []
  const others = products.filter(product => product.id !== productId)
  const sameCategory = others.filter(product => product.categoryId === current.categoryId)
  const rest = others.filter(product => product.categoryId !== current.categoryId).sort((a, b) => Number(b.featured) - Number(a.featured))
  return [...sameCategory, ...rest].slice(0, limit)
}

/** The CRM showroom when one is set, otherwise the built-in living room. */
export async function getShowroom(): Promise<ShowroomConfig> {
  return (await getCatalogue()).showroom ?? defaultShowroom
}

/** Texts and prices for the levha configurator, or null when the API does not offer it. */
export async function getLevha() {
  return (await getCatalogue()).levha
}
