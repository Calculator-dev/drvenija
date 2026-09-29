import type { Metadata } from "next"
import { SuccessPage } from "@/components/pages/success-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  path: "/checkout/success",
  title: "Narudžba zaprimljena | Drvenija",
})

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const params = await searchParams
  return <SuccessPage locale="bs" orderNumber={params.order} />
}
