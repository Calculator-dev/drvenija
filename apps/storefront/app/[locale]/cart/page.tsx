import type { Metadata } from "next"
import { CartCatalogueSync } from "@/components/cart-catalogue-sync"
import { CartPage } from "@/components/pages/cart-page"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return createMetadata({ locale: await resolveLocale(params), path: "/cart", title: { bs: "Korpa | Drvenija", en: "Your cart | Drvenija" }, noIndex: true })
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  return <>
    <CartCatalogueSync locale={locale} />
    <CartPage locale={locale} />
  </>
}
