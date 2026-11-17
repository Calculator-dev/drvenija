"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import { ProductCard } from "@/components/product-card"
import { useWishlist } from "@/components/wishlist-provider"
import { buildPath, type Locale, type LocalizedProduct } from "@/lib/products"

export function WishlistPage({ locale, products }: { locale: Locale; products: LocalizedProduct[] }) {
  const t = useTranslations("wishlist")
  const { ids } = useWishlist()
  // Saved order, newest first; products no longer sold are skipped.
  const saved = ids.flatMap(id => products.find(product => product.id === id) ?? [])

  return (
    <div className="mx-auto max-w-375 px-4 pb-20 pt-10 md:px-6 md:pb-28 md:pt-14">
      <div className="border-b border-border pb-6 md:pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent-ink">{t("eyebrow")}</p>
        <h1 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">{t("title")}</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{t("description")}</p>
      </div>

      {saved.length === 0 ? (
        <section className="flex min-h-90 flex-col items-center justify-center text-center">
          <Heart className="h-10 w-10 text-accent-ink" strokeWidth={1.2} aria-hidden />
          <h2 className="mt-5 font-serif text-3xl">{t("emptyTitle")}</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">{t("emptyText")}</p>
          <Link href={buildPath(locale, "/shop")} className="mt-8 flex h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-accent-foreground hover:bg-accent-hover">
            {t("browse")}
          </Link>
        </section>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
          {saved.map(product => <ProductCard key={product.id} locale={locale} product={product} />)}
        </div>
      )}
    </div>
  )
}
