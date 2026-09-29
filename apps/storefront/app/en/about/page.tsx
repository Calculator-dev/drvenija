import type { Metadata } from "next"
import { AboutPage } from "@/components/pages/about-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  locale: "en",
  path: "/about",
  title: "About | Drvenija",
})

export default function Page() {
  return <AboutPage locale="en" />
}
