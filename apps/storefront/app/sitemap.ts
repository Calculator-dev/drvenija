import type { MetadataRoute } from "next"
import { getAbsoluteUrl } from "@/lib/seo"
import { getCategories, getProducts } from "@/lib/catalogue"
import { categoryPath } from "@/lib/products"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "/",
    "/about",
    "/shop",
    "/custom",
    "/showroom",
    "/levha",
    "/en",
    "/en/about",
    "/en/shop",
    "/en/custom",
    "/en/showroom",
    "/en/levha",
  ]

  const [bs, en, categories] = await Promise.all([getProducts("bs"), getProducts("en"), getCategories("bs")])
  const categoryRoutes = categories
    .filter(category => bs.some(product => product.categoryId === category.id))
    .flatMap(category => [categoryPath("bs", category), categoryPath("en", category)])
  const productRoutes = [
    ...bs.map((product) => `/product/${product.localizedSlug}`),
    ...en.map((product) => `/en/product/${product.localizedSlug}`),
  ]

  return [...routes, ...categoryRoutes, ...productRoutes].map((route) => ({
    url: getAbsoluteUrl(route),
    changeFrequency: route.includes("/product/") ? "weekly" : "daily",
    priority: route === "/" ? 1 : 0.7,
  }))
}
