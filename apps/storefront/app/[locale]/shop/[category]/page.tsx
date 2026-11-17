import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { ShopPage } from "@/components/pages/shop-page"
import { getCategoryBySlug } from "@/lib/catalogue"
import { resolveLocale } from "@/lib/locale-params"
import { categoryPath } from "@/lib/products"
import { createMetadata, getAbsoluteUrl } from "@/lib/seo"

type Props = { params: Promise<{ locale: string; category: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const category = await getCategoryBySlug(locale, decodeURIComponent((await params).category))
  if (!category) return {}
  const metadata = await createMetadata({
    locale,
    path: `/shop/${category.localizedSlug}`,
    title: category.seo.title[locale] || category.localizedName,
    description: category.seo.description[locale] || category.localizedDescription || undefined,
  })
  return {
    ...metadata,
    alternates: {
      canonical: getAbsoluteUrl(categoryPath(locale, category)),
      languages: {
        bs: getAbsoluteUrl(categoryPath("bs", category)),
        en: getAbsoluteUrl(categoryPath("en", category)),
        "x-default": getAbsoluteUrl(categoryPath("bs", category)),
      },
    },
  }
}

export default async function Page({ params }: Props) {
  const locale = await resolveLocale(params)
  const slug = decodeURIComponent((await params).category)
  const category = await getCategoryBySlug(locale, slug)
  if (!category) notFound()
  // A slug from the other language (e.g. after switching language) goes to this language's URL.
  if (slug !== category.localizedSlug) redirect(categoryPath(locale, category))
  return <ShopPage locale={locale} category={category} />
}
