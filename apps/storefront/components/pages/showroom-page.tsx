"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useCart } from "@/components/cart-provider"
import { ShowroomViewer } from "@/components/showroom-viewer"
import { StarRating } from "@/components/star-rating"
import { activeVariants, buildPath, formatPrice, isSvg, type Locale, type LocalizedCategory } from "@/lib/products"
import type { ShowroomConfig, ShowroomProduct, WallColour } from "@/lib/showroom"
import { cn } from "@/lib/utils"

/** All products, one at a time, on the showroom wall. The chosen product is kept in the URL. */
export function ShowroomPage({ locale, products, categories, showroom, initialSlug }: {
  locale: Locale
  products: ShowroomProduct[]
  categories: LocalizedCategory[]
  showroom: ShowroomConfig
  initialSlug?: string
}) {
  const t = useTranslations("showroom")
  const product = useTranslations("product")
  const router = useRouter()
  const pathname = usePathname()
  const { addItem } = useCart()
  const initial = products.find(item => item.localizedSlug === initialSlug || item.slug.bs === initialSlug || item.slug.en === initialSlug) ?? products[0]
  const [selectedId, setSelectedId] = useState(initial?.id)
  const [categoryId, setCategoryId] = useState("all")
  const [variantId, setVariantId] = useState<string | undefined>(undefined)
  const [wall, setWall] = useState<WallColour>(null)
  const selected = products.find(item => item.id === selectedId) ?? products[0]
  const visible = useMemo(() => products.filter(item => categoryId === "all" || item.categoryId === categoryId), [categoryId, products])

  if (!selected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6">
        <h1 className="font-serif text-5xl">{t("title")}</h1>
        <p className="mt-5 text-muted-foreground">{t("empty")}</p>
        <Link href={buildPath(locale, "/shop")} className="mt-8 inline-flex h-12 items-center justify-center bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover">{t("browseShop")}</Link>
      </div>
    )
  }

  const variants = activeVariants(selected)
  const variant = variants.find(item => item.id === variantId) ?? variants[0]!
  const productHref = `${buildPath(locale, "/product")}/${selected.localizedSlug}`

  const choose = (item: ShowroomProduct) => {
    setSelectedId(item.id)
    setVariantId(undefined)
    router.replace(`${pathname}?proizvod=${encodeURIComponent(item.localizedSlug)}`, { scroll: false })
  }

  return (
    <div className="mx-auto max-w-375 px-4 pb-20 pt-8 md:px-6 md:pb-28 md:pt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent-ink">{t("eyebrow")}</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">{t("title")}</h1>
      <span aria-hidden className="mt-4 block h-px w-10 bg-accent" />
      <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">{t("description")}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.55fr)] lg:gap-10">
        <ShowroomViewer config={showroom} product={selected} locale={locale} variantId={variant.id} onVariantChange={setVariantId} wall={wall} onWallChange={setWall} priority />

        <aside className="h-fit border border-border bg-card p-6 lg:sticky lg:top-28">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{selected.categoryName?.[locale] ?? ""}</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">{selected.localizedName}</h2>
          {selected.rating && <StarRating value={selected.rating.average} className="mt-2" />}
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{selected.localizedShortDescription}</p>
          <p className="mt-5 text-2xl font-bold">{formatPrice(variant.price, locale)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{variant.dimensions}</p>
          <div className="mt-6 grid gap-3">
            {selected.customizable ? (
              <Link href={productHref} className="flex h-12 items-center justify-center bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover">
                {t("personalise")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => { addItem(selected, { variantId: variant.id }); toast.success(product("addedToCart")) }}
                className="h-12 bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                {product("addToCart")} · {formatPrice(variant.price, locale)}
              </button>
            )}
            <Link href={productHref} className="flex h-12 items-center justify-center border border-foreground px-5 text-sm font-semibold transition-colors hover:bg-foreground hover:text-background">
              {t("viewProduct")}
            </Link>
          </div>
        </aside>
      </div>

      <section className="mt-14" aria-labelledby="showroom-pick">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="showroom-pick" className="font-serif text-3xl">{t("pickTitle")}</h2>
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {[{ id: "all", localizedName: t("allCategories") }, ...categories].map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  aria-pressed={categoryId === category.id}
                  className={cn("rounded-full border px-4 py-1.5 text-sm transition-colors", categoryId === category.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground")}
                >
                  {category.localizedName}
                </button>
              ))}
            </div>
          )}
        </div>
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {visible.map(item => {
            const image = item.cutoutImage
            const active = item.id === selected.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => choose(item)}
                  aria-pressed={active}
                  className={cn("group block w-full text-left", active && "pointer-events-none")}
                >
                  <span className={cn("relative block aspect-square overflow-hidden rounded-sm border-2 bg-muted transition-colors", active ? "border-accent" : "border-transparent group-hover:border-accent/50")}>
                    <Image unoptimized={isSvg(image.url)} src={image.url} alt="" fill sizes="(min-width: 1024px) 12vw, 30vw" className="object-contain p-2" />
                  </span>
                  <span className={cn("mt-2 block truncate text-xs", active ? "font-semibold text-accent-ink" : "text-foreground/80")}>{item.localizedName}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
