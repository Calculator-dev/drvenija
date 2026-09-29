import type { Metadata } from "next"
import { CustomPage } from "@/components/pages/custom-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  path: "/custom",
  title: "Custom izrada | Drvenija",
})

export default function Page() {
  return <CustomPage locale="bs" />
}
