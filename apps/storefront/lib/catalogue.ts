import "server-only"
import { localizeCategory, localizeProduct, type Category, type Product, type Locale } from "./products"

export async function getCatalogue(): Promise<{ products: Product[]; categories: Category[] }> {
  const api = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")
  const response = await fetch(`${api}/public/catalogue`, { cache: "no-store", signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error("The product catalogue is temporarily unavailable")
  const data = await response.json() as { products: Product[]; categories: Category[] }
  return { ...data, products: data.products.map(product => ({ ...product, media: product.media.map(image => ({ ...image, url: `/api/media/${image.id}` })) })) }
}
export async function getProducts(locale: Locale) {
  return (await getCatalogue()).products.map(product => localizeProduct(product, locale))
}
export async function getCategories(locale: Locale) {
  return (await getCatalogue()).categories.map(category => localizeCategory(category, locale))
}
export async function getFeaturedProducts(locale: Locale) {
  return (await getProducts(locale)).filter(product => product.featured)
}
export async function getProductBySlug(locale: Locale, slug: string) {
  return (await getProducts(locale)).find(product => product.localizedSlug === slug || product.slug.bs === slug || product.slug.en === slug) ?? null
}
export async function getRelatedProducts(locale: Locale, productId: string, limit = 3) {
  const products = await getProducts(locale)
  const current = products.find(product => product.id === productId)
  return current ? products.filter(product => product.id !== productId && product.categoryId === current.categoryId).slice(0, limit) : []
}
