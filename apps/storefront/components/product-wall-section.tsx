import Link from "next/link"
import { useTranslations } from "next-intl"
import { Reveal } from "@/components/reveal"
import { ShowroomViewer } from "@/components/showroom-viewer"
import { buildPath, type Locale } from "@/lib/products"
import type { ShowroomConfig, ShowroomProduct } from "@/lib/showroom"

/** "On your wall": the product's cutout in the showroom. Only rendered for products with a cutout. */
export function ProductWallSection({ locale, product, showroom }: { locale: Locale; product: ShowroomProduct; showroom: ShowroomConfig }) {
  const t = useTranslations("product.mockup")

  return (
    <section className="border-t border-border/60 bg-secondary/60">
      <div className="mx-auto grid max-w-375 items-center gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-16">
        <ShowroomViewer config={showroom} product={product} locale={locale} />
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-ink">{t("eyebrow")}</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight md:text-5xl">{t("title")}</h2>
          <span aria-hidden className="mt-4 block h-px w-10 bg-accent" />
          <p className="mt-5 max-w-md text-base leading-8 text-foreground/70">{t("text")}</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
            <Link href={`${buildPath(locale, "/showroom")}?proizvod=${encodeURIComponent(product.localizedSlug)}`} className="inline-flex items-center gap-2 border-b border-accent pb-1 text-sm font-semibold text-accent-ink">{t("showroomCta")}</Link>
            <Link href={buildPath(locale, "/custom")} className="inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-semibold">{t("cta")}</Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
