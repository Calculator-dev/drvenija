import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ShowroomPage } from "@/components/pages/showroom-page"
import { hasCutout } from "@/lib/showroom"
import { getCategories, getProducts, getShowroom } from "@/lib/catalogue"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

type Props = LocaleParams & { searchParams: Promise<{ proizvod?: string }> }

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: "meta" })
  const showroom = await getTranslations({ locale, namespace: "showroom" })
  return createMetadata({ locale, path: "/showroom", title: t("showroom"), description: showroom("description") })
}

export default async function Page({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const [allProducts, categories, showroom] = await Promise.all([getProducts(locale), getCategories(locale), getShowroom()])
  // Only products with a cutout ("Slika bez pozadine") can hang on the showroom wall.
  const products = allProducts.filter(hasCutout)
  const requested = (await searchParams).proizvod
  return (
    <ShowroomPage
      locale={locale}
      products={products}
      categories={categories.filter(category => products.some(product => product.categoryId === category.id))}
      showroom={showroom}
      initialSlug={typeof requested === "string" ? requested : undefined}
    />
  )
}
