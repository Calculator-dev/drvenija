import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { ProductPageLayout } from "@/components/product-page-layout"
import { getCategories, getProductBySlug, getRelatedProducts } from "@/lib/catalogue"
import { resolveLocale } from "@/lib/locale-params"
import { activeVariants, buildPath, displayPrice } from "@/lib/products"
import { createMetadata, getAbsoluteUrl } from "@/lib/seo"

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const product = await getProductBySlug(locale, (await params).slug)
  if (!product) return {}

  const productPath = (target: "bs" | "en") => buildPath(target, `/product/${product.slug[target]}`)
  const metadata = await createMetadata({
    locale,
    path: `/product/${product.localizedSlug}`,
    title: product.seo.title[locale],
    description: product.seo.description[locale],
    image: product.media.length ? product.primaryImage.url : undefined,
  })

  return {
    ...metadata,
    alternates: {
      canonical: getAbsoluteUrl(productPath(locale)),
      languages: {
        bs: getAbsoluteUrl(productPath("bs")),
        en: getAbsoluteUrl(productPath("en")),
        "x-default": getAbsoluteUrl(productPath("bs")),
      },
    },
  }
}

export default async function Page({ params }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const product = await getProductBySlug(locale, slug)
  if (!product) notFound()
  const canonicalPath = buildPath(locale, `/product/${product.localizedSlug}`)
  if (slug !== product.localizedSlug) redirect(canonicalPath)

  const [related, categories] = await Promise.all([getRelatedProducts(locale, product.id), getCategories(locale)])
  const category = categories.find(item => item.id === product.categoryId)
  const price = displayPrice(product)

  return (
    <>
      <ProductPageLayout locale={locale} product={product} related={related} category={category} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.localizedName,
            description: product.localizedDescription,
            image: [getAbsoluteUrl(product.primaryImage.url)],
            sku: product.sku,
            ...(product.rating ? {
              aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count, bestRating: 5, worstRating: 1 },
              review: (product.reviews ?? []).slice(0, 5).map(review => ({
                "@type": "Review",
                author: { "@type": "Person", name: review.authorName },
                reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
                reviewBody: review.body,
                datePublished: review.createdAt.slice(0, 10),
              })),
            } : {}),
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: product.currency,
              lowPrice: price.amount,
              highPrice: Math.max(...activeVariants(product).map(variant => variant.price)),
              offerCount: activeVariants(product).length,
              // Items are made after the order is confirmed.
              availability: "https://schema.org/MadeToOrder",
              url: getAbsoluteUrl(canonicalPath),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  )
}
