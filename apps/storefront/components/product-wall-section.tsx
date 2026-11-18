"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Reveal } from "@/components/reveal"
import { ShowroomViewer } from "@/components/showroom-viewer"
import { buildPath, isSvg, type Locale, type LocalizedProduct } from "@/lib/products"
import type { ShowroomConfig } from "@/lib/showroom"
import { cn } from "@/lib/utils"

/** "On your wall": the product in the showroom, and its real room photo when there is one. */
export function ProductWallSection({ locale, product, showroom }: { locale: Locale; product: LocalizedProduct; showroom: ShowroomConfig }) {
  const t = useTranslations("product.mockup")
  const [tab, setTab] = useState<"showroom" | "photo">("showroom")
  const photo = product.roomImage

  return (
    <section className="border-t border-border/60 bg-secondary/60">
      <div className="mx-auto grid max-w-375 items-center gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-16">
        <div>
          {photo && (
            <div role="tablist" aria-label={t("eyebrow")} className="mb-4 flex gap-2">
              {(["showroom", "photo"] as const).map(key => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn("rounded-full border px-4 py-1.5 text-sm transition-colors", tab === key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground")}
                >
                  {t(`tabs.${key}`)}
                </button>
              ))}
            </div>
          )}
          {photo && tab === "photo" ? (
            <figure>
              <div className="relative aspect-4/3 overflow-hidden rounded-sm border border-accent/25 bg-muted">
                <Image unoptimized={isSvg(photo.url)} src={photo.url} alt={photo.alt[locale]} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="mt-3 text-xs text-muted-foreground">{t("photoCaption")}</figcaption>
            </figure>
          ) : (
            <ShowroomViewer config={showroom} product={product} locale={locale} />
          )}
        </div>
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-ink">{t("eyebrow")}</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight md:text-5xl">{t("title")}</h2>
          <span aria-hidden className="mt-4 block h-px w-10 bg-accent" />
          <p className="mt-5 max-w-md text-base leading-8 text-foreground/70">{photo && tab === "photo" ? t("photoText") : t("text")}</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
            <Link href={`${buildPath(locale, "/showroom")}?proizvod=${encodeURIComponent(product.localizedSlug)}`} className="inline-flex items-center gap-2 border-b border-accent pb-1 text-sm font-semibold text-accent-ink">{t("showroomCta")}</Link>
            <Link href={buildPath(locale, "/custom")} className="inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-semibold">{t("cta")}</Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
