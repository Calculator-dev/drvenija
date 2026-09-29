import type { Metadata } from "next"
import { CartCatalogueSync } from "@/components/cart-catalogue-sync"
import { CartPage } from "@/components/pages/cart-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  path: "/cart",
  title: "Korpa | Drvenija",
})

export default function Page() {
  return <>
    <CartCatalogueSync locale="bs" />
    <CartPage locale="bs" />
  </>
}
