import Link from "next/link"
import { useTranslations } from "next-intl"
import { ProductCard } from "@/components/product-card"
import { ProductDetail } from "@/components/product-detail"
import { ProductGallery } from "@/components/product-gallery"
import { Reveal } from "@/components/reveal"
import { Rosette } from "@/components/rosette"
import { buildPath, type Locale, type LocalizedProduct } from "@/lib/products"

export function ProductPageLayout({ locale, product, related }: { locale: Locale; product: LocalizedProduct; related: LocalizedProduct[] }) {
  const t = useTranslations("product")
  const shop = useTranslations("shop")
  const common = useTranslations("common")
  const images = product.media.length ? product.media : [product.primaryImage]

  const highlights = [
    { title: t("highlights.cncTitle"), text: t("highlights.cncText") },
    { title: t("highlights.materialTitle"), text: product.material === "mediapan" ? t("highlights.materialTextMediapan") : t("highlights.materialTextPlexiglass") },
    { title: t("highlights.finishTitle"), text: t("highlights.finishText") },
    { title: t("highlights.packagingTitle"), text: t("highlights.packagingText") },
  ]

  return (
    <article className="mx-auto max-w-7xl px-4 pb-20 pt-7 md:px-10 md:pb-24">
      <nav aria-label={t("breadcrumb")} className="flex min-w-0 items-center gap-2 overflow-hidden text-[13px] text-muted-foreground">
        <Link href={buildPath(locale)} className="shrink-0 text-gold-deep transition-colors hover:text-foreground">{common("home")}</Link>
        <span aria-hidden="true">/</span>
        <Link href={buildPath(locale, "/shop")} className="shrink-0 text-gold-deep transition-colors hover:text-foreground">{shop("allProducts")}</Link>
        <span aria-hidden="true">/</span>
        <span className="truncate">{product.localizedName}</span>
      </nav>

      <div className="mt-7 grid items-start gap-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <ProductGallery locale={locale} images={images} badge={product.featured ? t("featured") : undefined} />
        <div className="lg:sticky lg:top-36"><ProductDetail locale={locale} product={product} /></div>
      </div>

      <section aria-label={t("highlights.title")} className="mt-20 grid gap-8 border-t border-border pt-12 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((highlight, index) => (
          <Reveal key={highlight.title} delay={index * 0.05} className="flex flex-col gap-2.5">
            <Rosette className="h-6.5 w-6.5 text-gold-deep" />
            <h2 className="font-serif text-[21px]">{highlight.title}</h2>
            <p className="text-[15px] leading-6 text-muted-foreground">{highlight.text}</p>
          </Reveal>
        ))}
      </section>

      {related.length > 0 && (
        <section className="mt-24">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-[30px] md:text-[34px]">{t("related")}</h2>
            <Link href={buildPath(locale, "/shop")} className="text-[15px] font-semibold text-gold-deep hover:text-foreground">{t("viewAll")} →</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-5.5 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item.id} locale={locale} product={item} />)}
          </div>
        </section>
      )}
    </article>
  )
}
