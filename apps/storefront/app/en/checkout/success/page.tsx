import type { Metadata } from "next"
import { SuccessPage } from "@/components/pages/success-page"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  locale: "en",
  path: "/checkout/success",
  title: "Order received | Drvenija",
})

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const params = await searchParams
  return <SuccessPage locale="en" orderNumber={params.order} />
}
