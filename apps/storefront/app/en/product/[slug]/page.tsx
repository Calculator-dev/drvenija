import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { ProductPageLayout } from "@/components/product-page-layout"
import { createMetadata, getAbsoluteUrl } from "@/lib/seo"
import { getProductBySlug, getRelatedProducts } from "@/lib/catalogue"
import { displayPrice } from "@/lib/products"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug("en", slug)
  if (!product) return {}

  const metadata = createMetadata({
    locale: "en",
    path: `/product/${slug}`,
    title: product.seo.title.en,
    description: product.seo.description.en,
  })

  return {
    ...metadata,
    alternates: {
      canonical: getAbsoluteUrl(`/en/product/${product.slug.en}`),
      languages: {
        bs: getAbsoluteUrl(`/product/${product.slug.bs}`),
        en: getAbsoluteUrl(`/en/product/${product.slug.en}`),
        "x-default": getAbsoluteUrl(`/product/${product.slug.bs}`),
      },
    },
    openGraph: {
      ...metadata.openGraph,
      url: getAbsoluteUrl(`/en/product/${product.slug.en}`),
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug("en", slug)
  if (!product) notFound()
  if (slug !== product.localizedSlug) redirect(`/en/product/${product.localizedSlug}`)

  const related = await getRelatedProducts("en", product.id)

  return (
    <>
      <ProductPageLayout locale="en" product={product} related={related} />

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
            offers: {
              "@type": "Offer",
              priceCurrency: product.currency,
              price: displayPrice(product).amount,
              availability: "https://schema.org/InStock",
              url: getAbsoluteUrl(`/en/product/${product.localizedSlug}`),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  )
}
