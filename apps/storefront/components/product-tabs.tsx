"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { ProductCard } from "@/components/product-card"
import type { Locale, LocalizedProduct } from "@/lib/products"
import { cn } from "@/lib/utils"

type TabKey = "bestsellers" | "personalised" | "mediapan" | "plexiglass"

const tabFilters: Record<TabKey, (product: LocalizedProduct) => boolean> = {
  bestsellers: product => product.featured,
  personalised: product => product.customizable,
  mediapan: product => product.material === "mediapan",
  plexiglass: product => product.material === "plexiglass",
}

/** Home page product row with tabs; tabs without products are hidden. */
export function ProductTabs({ locale, products, shopHref }: { locale: Locale; products: LocalizedProduct[]; shopHref: string }) {
  const t = useTranslations("home.products")
  const lists = (Object.keys(tabFilters) as TabKey[])
    .map(key => ({ key, items: products.filter(tabFilters[key]).slice(0, 8) }))
    .filter(list => list.items.length > 0)
  // Without bestsellers marked in the CRM, the first tab shows the newest catalogue items.
  if (!lists.some(list => list.key === "bestsellers")) lists.unshift({ key: "bestsellers", items: products.slice(0, 8) })
  const [active, setActive] = useState<TabKey>(lists[0]!.key)
  const current = lists.find(list => list.key === active) ?? lists[0]!

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("eyebrow")}</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">{t("title")}</h2>
        </div>
        <div role="tablist" aria-label={t("title")} className="-mx-4 flex gap-2 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0">
          {lists.map(list => (
            <button
              key={list.key}
              type="button"
              role="tab"
              aria-selected={list.key === current.key}
              onClick={() => setActive(list.key)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                list.key === current.key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground",
              )}
            >
              {t(`tabs.${list.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className="-mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-12 md:overflow-visible md:px-0 lg:grid-cols-4">
        {current.items.map((product, index) => (
          <div key={product.id} className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-auto">
            <ProductCard locale={locale} product={product} priority={index < 2} />
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href={shopHref} className="inline-flex min-h-12 items-center gap-2 border border-foreground px-7 text-sm font-semibold transition-colors hover:bg-foreground hover:text-background">
          {t("viewAll")} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
