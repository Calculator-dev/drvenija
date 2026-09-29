"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useCart } from "@/components/cart-provider"
import type { CatalogueOffer, Locale, ShippingPolicy } from "@/lib/products"

export function CartRepricer({ locale, offers, shipping }: { locale: Locale; offers: CatalogueOffer[]; shipping: ShippingPolicy }) {
  const { syncWithCatalogue, lastSync } = useCart()

  useEffect(() => {
    syncWithCatalogue(offers, shipping)
  }, [offers, shipping, syncWithCatalogue])

  useEffect(() => {
    if (!lastSync) return
    if (lastSync.removed) toast.warning(locale === "bs"
      ? "Neki proizvodi više nisu dostupni i uklonjeni su iz korpe."
      : "Some products are no longer available and were removed from your cart.")
    if (lastSync.repriced) toast.info(locale === "bs"
      ? "Cijene u korpi su ažurirane prema aktuelnom katalogu."
      : "Cart prices were updated to match the current catalogue.")
  }, [lastSync, locale])

  return null
}
