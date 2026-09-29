import type { MetadataRoute } from "next"
import { getAbsoluteUrl } from "@/lib/seo"
import { getProducts } from "@/lib/catalogue"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "/",
    "/about",
    "/shop",
    "/custom",
    "/cart",
    "/checkout",
    "/en",
    "/en/about",
    "/en/shop",
    "/en/custom",
    "/en/cart",
    "/en/checkout",
  ]

  const productRoutes = [
    ...(await getProducts("bs")).map((product) => `/product/${product.localizedSlug}`),
    ...(await getProducts("en")).map((product) => `/en/product/${product.localizedSlug}`),
  ]

  return [...routes, ...productRoutes].map((route) => ({
    url: getAbsoluteUrl(route),
    changeFrequency: route.includes("/product/") ? "weekly" : "daily",
    priority: route === "/" ? 1 : 0.7,
  }))
}
