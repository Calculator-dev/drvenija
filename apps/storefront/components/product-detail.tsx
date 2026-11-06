"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Check, ChevronDown, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/components/cart-provider"
import { TrustBar } from "@/components/trust-bar"
import { activeVariants, formatPrice, isSvg, type Locale, type LocalizedProduct } from "@/lib/products"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function ProductDetail({ locale, product }: { locale: Locale; product: LocalizedProduct }) {
  const { addItem, shippingPolicy } = useCart()
  const addButton = useRef<HTMLButtonElement | null>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [personalization, setPersonalization] = useState("")
  const variants = activeVariants(product)
  const [variantId, setVariantId] = useState(() => variants[0]!.id)
  const selectedVariant = variants.find(variant => variant.id === variantId) ?? variants[0]!
  const t = useTranslations("product")
  const common = useTranslations("common")
  const materialName = common(`materials.${product.material}`)

  // The bottom bar appears on small screens once the main button has scrolled out of view.
  useEffect(() => {
    const target = addButton.current
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0))
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const handleAdd = () => {
    addItem(product, { quantity, personalization: personalization.trim() || undefined, variantId: selectedVariant.id })
    toast.success(t("addedToCart"))
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {product.categoryName?.[locale] ?? ""} · {materialName}
      </p>
      <h1 className="mt-4 wrap-break-word font-serif text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">{product.localizedName}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{product.localizedTagline}</p>

      <p className="mt-5 break-all text-xs text-muted-foreground">SKU: <span className="text-foreground">{selectedVariant.sku}</span></p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <p className="text-3xl font-bold text-foreground">{formatPrice(selectedVariant.price, locale)}</p>
        <span className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"><Check className="h-3.5 w-3.5" />{product.localizedStockLabel}</span>
      </div>

      {variants.length > 1 && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("chooseDimensions")}</p>
          <div className="flex flex-wrap gap-2">
            {variants.map(variant => {
              const active = variant.id === selectedVariant.id
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  aria-pressed={active}
                  className={`border px-3 py-2 text-sm transition-colors ${active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                >
                  {variant.dimensions}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-7 border-t border-border/60 pt-7 text-sm leading-8 text-foreground/80">{product.localizedDescription}</p>

      <dl className="mt-7 grid gap-5 border-y border-border/60 py-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("dimensions")}</dt>
          <dd className="mt-1 text-foreground">{selectedVariant.dimensions}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("leadTime")}</dt>
          <dd className="mt-1 text-foreground">{product.localizedLeadTime}</dd>
        </div>
      </dl>

      {product.customizable && (
        <div className="mt-7">
          <label htmlFor="personalization" className="block text-sm font-semibold">
            {t("personalization")}
          </label>
          <textarea
            id="personalization"
            rows={3}
            value={personalization}
            onChange={(event) => setPersonalization(event.target.value)}
            placeholder={t("personalizationPlaceholder")}
            className="mt-3 w-full resize-none border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
          />
        </div>
      )}

      <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row">
        <div className="inline-flex items-center justify-between border border-border sm:justify-start">
          <button type="button" className="flex h-12 w-12 items-center justify-center" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label={common("decreaseQuantity")}>
            <Minus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
          <span className="flex h-12 w-12 items-center justify-center text-sm" aria-live="polite">{quantity}</span>
          <button type="button" className="flex h-12 w-12 items-center justify-center" onClick={() => setQuantity((value) => Math.min(1000, value + 1))} aria-label={common("increaseQuantity")}>
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <button
          ref={addButton}
          type="button"
          onClick={handleAdd}
          className="min-h-12 flex-1 bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("addToCart")} · {formatPrice(selectedVariant.price * quantity, locale)}
        </button>
      </div>

      <TrustBar variant="compact" freeFrom={shippingPolicy.freeFrom} className="mt-6 border border-border/70 bg-secondary/60 p-4" />

      <div className="mt-8 divide-y divide-border/60 border-y border-border/60 text-sm">
        <Accordion title={t("details.deliveryTitle")} open>{t("details.deliveryText", { leadTime: product.localizedLeadTime })}</Accordion>
        <Accordion title={t("details.careTitle")}>{t("details.careText")}</Accordion>
        <Accordion title={t("details.bulkTitle")}>{t("details.bulkText")}</Accordion>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl transition-transform duration-300 lg:hidden",
          showStickyBar ? "translate-y-0" : "translate-y-full",
        )}
        inert={!showStickyBar}
      >
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-secondary">
            <Image unoptimized={isSvg(product.primaryImage.url)} src={product.primaryImage.url} alt="" fill sizes="48px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.localizedName}</p>
            <p className="truncate text-xs text-muted-foreground">{selectedVariant.dimensions} · {formatPrice(selectedVariant.price, locale)}</p>
          </div>
          <button type="button" onClick={handleAdd} className="h-11 shrink-0 bg-primary px-4 text-sm font-semibold text-primary-foreground">
            {t("addToCart")}
          </button>
        </div>
      </div>
    </div>
  )
}

function Accordion({ title, open = false, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="group py-4" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" strokeWidth={1.5} aria-hidden />
      </summary>
      <p className="mt-3 leading-6 text-muted-foreground">{children}</p>
    </details>
  )
}
