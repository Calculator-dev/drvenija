import type { Metadata } from "next"
import { CustomPage } from "@/components/pages/custom-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  locale: "en",
  path: "/custom",
  title: "Custom work | Drvenija",
})

export default function Page() {
  return <CustomPage locale="en" />
}
