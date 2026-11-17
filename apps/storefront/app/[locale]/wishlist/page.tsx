import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { WishlistPage } from "@/components/pages/wishlist-page"
import { getProducts } from "@/lib/catalogue"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: "meta" })
  return createMetadata({ locale, path: "/wishlist", title: t("wishlist"), noIndex: true })
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  return <WishlistPage locale={locale} products={await getProducts(locale)} />
}
