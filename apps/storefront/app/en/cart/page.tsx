import type { Metadata } from "next"
import { CartCatalogueSync } from "@/components/cart-catalogue-sync"
import { CartPage } from "@/components/pages/cart-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  locale: "en",
  path: "/cart",
  title: "Your cart | Drvenija",
})

export default function Page() {
  return <>
    <CartCatalogueSync locale="en" />
    <CartPage locale="en" />
  </>
}
