import type { Metadata } from "next"
import { CartPage } from "@/components/pages/cart-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  path: "/cart",
  title: "Korpa | Drvenija",
})

export default function Page() {
  return <CartPage locale="bs" />
}
