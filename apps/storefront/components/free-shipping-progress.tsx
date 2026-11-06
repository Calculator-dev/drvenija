"use client"

import { Truck } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCart } from "@/components/cart-provider"
import { formatPrice, type Locale } from "@/lib/products"

/** How far the cart is from free delivery, as a sentence and a bar. */
export function FreeShippingProgress({ locale }: { locale: Locale }) {
  const { subtotal, shippingPolicy } = useCart()
  const t = useTranslations("cart")
  const remaining = Math.max(0, shippingPolicy.freeFrom - subtotal)
  const percent = shippingPolicy.freeFrom > 0 ? Math.min(100, (subtotal / shippingPolicy.freeFrom) * 100) : 100

  return (
    <div className="bg-secondary px-4 py-3">
      <p className="flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.6} aria-hidden />
        {remaining > 0
          ? t.rich("freeShippingRemaining", { amount: formatPrice(remaining, locale), strong: chunks => <strong className="font-semibold">{chunks}</strong> })
          : <strong className="font-semibold">{t("freeShippingReached")}</strong>}
      </p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} aria-label={t("freeShippingLabel")}>
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
