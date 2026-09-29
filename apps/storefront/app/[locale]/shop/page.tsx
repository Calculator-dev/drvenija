import type { Metadata } from "next"
import { ShopPage } from "@/components/pages/shop-page"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return createMetadata({ locale: await resolveLocale(params), path: "/shop", title: { bs: "Webshop | Drvenija", en: "Shop | Drvenija" } })
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  return <ShopPage locale={locale} />
}
