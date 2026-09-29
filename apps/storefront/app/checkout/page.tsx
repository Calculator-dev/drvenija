import type { Metadata } from "next"
import { CheckoutPage } from "@/components/pages/checkout-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  path: "/checkout",
  title: "Checkout | Drvenija",
})

export default function Page() {
  return <CheckoutPage locale="bs" />
}
