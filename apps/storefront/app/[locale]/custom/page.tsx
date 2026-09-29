import type { Metadata } from "next"
import { CustomPage } from "@/components/pages/custom-page"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return createMetadata({ locale: await resolveLocale(params), path: "/custom", title: { bs: "Custom izrada | Drvenija", en: "Custom work | Drvenija" } })
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  return <CustomPage locale={locale} />
}
