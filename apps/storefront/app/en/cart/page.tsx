import type { Metadata } from "next"
import { CartPage } from "@/components/pages/cart-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  locale: "en",
  path: "/cart",
  title: "Your cart | Drvenija",
})

export default function Page() {
  return <CartPage locale="en" />
}
