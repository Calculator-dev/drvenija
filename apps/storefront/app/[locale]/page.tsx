import type { Metadata } from "next"
import { HomePage } from "@/components/pages/home-page"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return createMetadata({ locale: await resolveLocale(params), path: "/", title: { bs: "Drvenija | CNC webshop za pleksiglas i mediapan", en: "Drvenija | CNC webshop for plexiglass and MDF" } })
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  return <HomePage locale={locale} />
}
