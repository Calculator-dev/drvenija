import type { Metadata } from "next"
import { AboutPage } from "@/components/pages/about-page"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return createMetadata({ locale: await resolveLocale(params), path: "/about", title: { bs: "O nama | Drvenija", en: "About | Drvenija" } })
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  return <AboutPage locale={locale} />
}
