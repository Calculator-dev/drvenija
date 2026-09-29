import type { Metadata } from "next"
import { AboutPage } from "@/components/pages/about-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  path: "/about",
  title: "O nama | Drvenija",
})

export default function Page() {
  return <AboutPage locale="bs" />
}
