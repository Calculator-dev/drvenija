"use client"

import Link from "next/link"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Check, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/components/cart-provider"
import { Rosette } from "@/components/rosette"
import { activeVariants, buildPath, formatPrice, type Locale, type LocalizedProduct } from "@/lib/products"
import { cn } from "@/lib/utils"

export function ProductDetail({ locale, product }: { locale: Locale; product: LocalizedProduct }) {
  const { addItem, shippingPolicy } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [personalization, setPersonalization] = useState("")
  const variants = activeVariants(product)
  const [variantId, setVariantId] = useState(() => variants[0]!.id)
  const selectedVariant = variants.find(variant => variant.id === variantId) ?? variants[0]!
  const t = useTranslations("product")
  const common = useTranslations("common")
  const materialName = common(`materials.${product.material}`)

  const handleAdd = () => {
    addItem(product, { quantity, personalization: personalization.trim() || undefined, variantId: selectedVariant.id })
    toast.success(t("addedToCart"))
  }

  return (
    <div className="flex flex-col gap-6.5">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6b6458]">
          {[product.categoryName?.[locale], materialName].filter(Boolean).join(" · ")}
        </p>
        <h1 className="wrap-break-word font-serif text-[34px] leading-[1.08] text-foreground md:text-5xl">{product.localizedName}</h1>
        {product.localizedTagline && <p className="text-base leading-7 text-muted-foreground">{product.localizedTagline}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[26px] font-semibold text-foreground">{formatPrice(selectedVariant.price, locale)}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground"><Check className="h-3.5 w-3.5" aria-hidden />{product.localizedStockLabel}</span>
        </div>
        <p className="text-base leading-7 text-[#4a453d]">{product.localizedDescription}</p>
      </div>

      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-3 text-sm font-bold">{t("chooseDimensions")}</legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {variants.map(variant => {
              const active = variant.id === selectedVariant.id
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2 transition-colors",
                    active ? "border-2 border-night bg-white" : "border border-input hover:border-foreground",
                  )}
                >
                  <span className="text-[15px] font-bold">{variant.dimensions}</span>
                  <span className="text-xs text-muted-foreground">{formatPrice(variant.price, locale)}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {product.customizable && (
        <div>
          <label htmlFor="personalization" className="block text-sm font-bold">
            {t("personalization")}
          </label>
          <textarea
            id="personalization"
            rows={3}
            value={personalization}
            onChange={(event) => setPersonalization(event.target.value)}
            placeholder={t("personalizationPlaceholder")}
            className="mt-3 w-full resize-none rounded-lg border border-input bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
          />
        </div>
      )}

      <div className="flex flex-wrap items-stretch gap-3">
        <div role="group" aria-label={t("quantity")} className="inline-flex h-14 items-center rounded-full border border-input">
          <button type="button" className="flex h-full w-11 items-center justify-center rounded-l-full sm:w-13" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label={common("decreaseQuantity")}>
            <Minus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
          <span className="min-w-7 text-center text-sm font-bold" aria-live="polite">{quantity}</span>
          <button type="button" className="flex h-full w-11 items-center justify-center rounded-r-full sm:w-13" onClick={() => setQuantity((value) => Math.min(1000, value + 1))} aria-label={common("increaseQuantity")}>
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="h-14 flex-[1_1_180px] whitespace-nowrap rounded-full bg-night px-4 text-[15px] font-bold sm:px-6 sm:text-base text-primary-foreground transition-colors hover:bg-[#2a2721]"
        >
          {t("addToCart")} · {formatPrice(selectedVariant.price * quantity, locale)}
        </button>
      </div>

      <div className="flex items-start gap-3.5 rounded-lg bg-muted px-5 py-4.5">
        <Rosette className="mt-0.5 h-5.5 w-5.5 text-gold-deep" />
        <p className="text-sm leading-6 text-[#3f3a33]">
          {t.rich("customNote", { link: chunks => <Link href={buildPath(locale, "/custom")} className="font-bold text-gold-deep underline-offset-2 hover:underline">{chunks}</Link> })}
        </p>
      </div>

      <dl className="border-t border-border text-sm">
        <InfoRow label={t("material")} value={materialName} />
        <InfoRow label={t("dimensions")} value={selectedVariant.dimensions} />
        <InfoRow label={t("leadTime")} value={product.localizedLeadTime} />
        <InfoRow label={t("delivery")} value={t("deliveryValue", { amount: String(shippingPolicy.freeFrom) })} />
      </dl>

      <div className="-mt-6.5 divide-y divide-border border-b border-border text-sm">
        <details className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between font-bold">{t("details.careTitle")}<Plus className="h-4 w-4 transition-transform group-open:rotate-45" aria-hidden /></summary><p className="mt-3 leading-6 text-muted-foreground">{t("details.careText")}</p></details>
        <details className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between font-bold">{t("details.bulkTitle")}<Plus className="h-4 w-4 transition-transform group-open:rotate-45" aria-hidden /></summary><p className="mt-3 leading-6 text-muted-foreground">{t("details.bulkText")}</p></details>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-4">
      <dt className="font-bold">{label}</dt>
      <dd className="text-right text-[#4a453d]">{value}</dd>
    </div>
  )
}
