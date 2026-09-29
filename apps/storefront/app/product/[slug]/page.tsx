import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { ProductPageLayout } from "@/components/product-page-layout"
import { createMetadata, getAbsoluteUrl } from "@/lib/seo"
import { getProductBySlug, getRelatedProducts } from "@/lib/catalogue"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug("bs", slug)
  if (!product) return {}

  const metadata = createMetadata({
    path: `/product/${slug}`,
    title: product.seo.title.bs,
    description: product.seo.description.bs,
  })

  return {
    ...metadata,
    alternates: {
      canonical: getAbsoluteUrl(`/product/${product.slug.bs}`),
      languages: {
        bs: getAbsoluteUrl(`/product/${product.slug.bs}`),
        en: getAbsoluteUrl(`/en/product/${product.slug.en}`),
        "x-default": getAbsoluteUrl(`/product/${product.slug.bs}`),
      },
    },
    openGraph: {
      ...metadata.openGraph,
      url: getAbsoluteUrl(`/product/${product.slug.bs}`),
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug("bs", slug)
  if (!product) notFound()
  if (slug !== product.localizedSlug) redirect(`/product/${product.localizedSlug}`)

  const related = await getRelatedProducts("bs", product.id)

  return (
    <>
      <ProductPageLayout locale="bs" product={product} related={related} />

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
              price: product.priceFrom ?? product.price,
              availability: "https://schema.org/InStock",
              url: getAbsoluteUrl(`/product/${product.localizedSlug}`),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  )
}
