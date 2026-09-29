import type { Metadata } from "next"
import { ShopPage } from "@/components/pages/shop-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  locale: "en",
  path: "/shop",
  title: "Shop | Drvenija",
})

export default function Page() {
  return <ShopPage locale="en" />
}
