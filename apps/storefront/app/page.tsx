import type { Metadata } from "next"
import { HomePage } from "@/components/pages/home-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  path: "/",
  title: "Drvenija | CNC webshop za pleksiglas i mediapan",
})

export default function Page() {
  return <HomePage locale="bs" />
}
