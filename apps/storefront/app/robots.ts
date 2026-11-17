import type { MetadataRoute } from "next"
import { getAbsoluteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/wishlist", "/order", "/newsletter", "/en/cart", "/en/checkout", "/en/wishlist", "/en/order", "/en/newsletter"],
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
  }
}
