"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, X } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { formatPrice, type Locale, isSvg } from "@/lib/products"
import { cn } from "@/lib/utils"

export function CartDrawer({ locale }: { locale: Locale }) {
  const { items, isOpen, setOpen, removeItem, subtotal, updateQuantity } = useCart()
  const checkoutHref = locale === "en" ? "/en/checkout" : "/checkout"
  const cartHref = locale === "en" ? "/en/cart" : "/cart"

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] transition-opacity",
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 bg-foreground/35" onClick={() => setOpen(false)} />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background transition-transform",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex flex-1 items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{locale === "bs" ? "Korpa" : "Your cart"}</p>
            <Link
              href={cartHref}
              onClick={() => setOpen(false)}
              className="border-b border-foreground pb-0.5 text-xs font-medium text-foreground transition-opacity hover:opacity-60"
            >
              {locale === "bs" ? "Pogledaj korpu" : "View cart"}
            </Link>
          </div>
          <button type="button" className="ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-serif text-3xl">{locale === "bs" ? "Korpa je prazna" : "Your cart is empty"}</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              {locale === "bs"
                ? "Dodajte standardne proizvode ili personalizirane artikle iz webshopa."
                : "Add standard products or personalized pieces from the webshop."}
            </p>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {items.map((item) => (
                <li key={item.lineId} className="flex gap-3 border-b border-border/50 pb-4">
                  <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                    <Image unoptimized={isSvg(item.image)} src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatPrice(item.price, locale)}</p>
                        {item.dimensions && <p className="mt-1 text-xs text-muted-foreground">{locale === "bs" ? "Dimenzije" : "Dimensions"}: {item.dimensions}</p>}
                        {item.variantSku && <p className="mt-1 text-[11px] text-muted-foreground">SKU: {item.variantSku}</p>}
                      </div>
                      <button type="button" onClick={() => removeItem(item.lineId)} className="text-muted-foreground hover:text-foreground">
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    {item.personalization && <p className="mt-2 text-xs text-muted-foreground">{item.personalization}</p>}
                    <div className="mt-3 inline-flex items-center border border-border">
                      <button type="button" className="flex h-9 w-9 items-center justify-center" onClick={() => updateQuantity(item.lineId, item.quantity - 1)}>
                        <Minus className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <span className="flex h-9 w-10 items-center justify-center text-sm">{item.quantity}</span>
                      <button type="button" className="flex h-9 w-9 items-center justify-center" onClick={() => updateQuantity(item.lineId, item.quantity + 1)}>
                        <Plus className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border/60 px-5 py-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{locale === "bs" ? "Ukupno" : "Subtotal"}</span>
                <span className="font-serif text-2xl">{formatPrice(subtotal, locale)}</span>
              </div>
              <Link
                href={checkoutHref}
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center bg-foreground text-sm tracking-wide text-background transition-colors hover:bg-foreground/90"
              >
                {locale === "bs" ? "Nastavi na checkout" : "Proceed to checkout"}
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
