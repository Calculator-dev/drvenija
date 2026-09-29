import type { Metadata } from "next"
import { SuccessPage } from "@/components/pages/success-page"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

type Props = LocaleParams & { searchParams: Promise<{ order?: string }> }

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return createMetadata({ locale: await resolveLocale(params), path: "/checkout/success", title: { bs: "Narudžba zaprimljena | Drvenija", en: "Order received | Drvenija" }, noIndex: true })
}

export default async function Page({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  return <SuccessPage locale={locale} orderNumber={(await searchParams).order} />
}
