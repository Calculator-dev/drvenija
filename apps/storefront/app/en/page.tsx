import type { Metadata } from "next"
import { HomePage } from "@/components/pages/home-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  locale: "en",
  path: "/",
  title: "Drvenija | CNC webshop for plexiglass and MDF",
})

export default function Page() {
  return <HomePage locale="en" />
}
