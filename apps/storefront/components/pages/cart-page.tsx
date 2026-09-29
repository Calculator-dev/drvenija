"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { formatPrice, type Locale } from "@/lib/products"

export function CartPage({ locale }: { locale: Locale }) {
  const { items, subtotal, updateQuantity, removeItem, totalItems } = useCart()
  const shopHref = locale === "en" ? "/en/shop" : "/shop"
  const checkoutHref = locale === "en" ? "/en/checkout" : "/checkout"
  const productPrefix = locale === "en" ? "/en/product" : "/product"

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-14">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-6 md:pb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
            {locale === "bs" ? `${totalItems} artikala` : `${totalItems} items`}
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-none text-foreground sm:text-6xl">
            {locale === "bs" ? "Vaša korpa" : "Your cart"}
          </h1>
        </div>
        <Link href={shopHref} className="hidden border-b border-foreground pb-1 text-sm transition-opacity hover:opacity-60 sm:block">
          {locale === "bs" ? "Nastavi kupovinu" : "Continue shopping"}
        </Link>
      </div>

      {items.length === 0 ? (
        <section className="flex min-h-[430px] flex-col items-center justify-center text-center">
          <h2 className="font-serif text-3xl sm:text-4xl">{locale === "bs" ? "Korpa je prazna" : "Your cart is empty"}</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
            {locale === "bs"
              ? "Pronađite proizvod koji vam se sviđa i dodajte ga u korpu."
              : "Find something you love and add it to your cart."}
          </p>
          <Link href={shopHref} className="mt-8 flex h-12 items-center justify-center bg-foreground px-8 text-sm text-background transition-opacity hover:opacity-90">
            {locale === "bs" ? "Počni kupovinu" : "Start shopping"}
          </Link>
        </section>
      ) : (
        <div className="grid gap-10 pt-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <section>
            <div className="hidden grid-cols-[minmax(0,1fr)_150px_130px] border-b border-border pb-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground md:grid">
              <span>{locale === "bs" ? "Proizvod" : "Product"}</span>
              <span>{locale === "bs" ? "Količina" : "Quantity"}</span>
              <span className="text-right">{locale === "bs" ? "Ukupno" : "Total"}</span>
            </div>

            <ul>
              {items.map((item) => (
                <li key={item.lineId} className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-border py-6 sm:grid-cols-[130px_minmax(0,1fr)] md:grid-cols-[130px_minmax(0,1fr)_150px_130px] md:items-center md:gap-6">
                  <Link href={`${productPrefix}/${item.slug}`} className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <Image unoptimized src={item.image} alt={item.name} fill sizes="(max-width: 640px) 96px, 130px" className="object-cover transition-transform duration-500 hover:scale-105" />
                  </Link>

                  <div className="min-w-0 self-start md:self-center">
                    <Link href={`${productPrefix}/${item.slug}`} className="font-serif text-xl leading-tight text-foreground transition-opacity hover:opacity-60 sm:text-2xl">
                      {item.name}
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground">{formatPrice(item.price, locale)}</p>
                    {item.dimensions && <p className="mt-2 text-xs text-muted-foreground">{locale === "bs" ? "Dimenzije" : "Dimensions"}: {item.dimensions}</p>}
                    {item.variantSku && <p className="mt-1 text-xs text-muted-foreground">SKU: {item.variantSku}</p>}
                    {item.personalization && <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.personalization}</p>}

                    <div className="mt-5 flex items-center justify-between md:hidden">
                      <QuantityControl quantity={item.quantity} onDecrease={() => updateQuantity(item.lineId, item.quantity - 1)} onIncrease={() => updateQuantity(item.lineId, item.quantity + 1)} locale={locale} />
                      <button type="button" onClick={() => removeItem(item.lineId)} className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground" aria-label={locale === "bs" ? `Ukloni ${item.name}` : `Remove ${item.name}`}>
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <p className="mt-4 text-right font-medium md:hidden">{formatPrice(item.price * item.quantity, locale)}</p>
                  </div>

                  <div className="hidden md:block">
                    <QuantityControl quantity={item.quantity} onDecrease={() => updateQuantity(item.lineId, item.quantity - 1)} onIncrease={() => updateQuantity(item.lineId, item.quantity + 1)} locale={locale} />
                    <button type="button" onClick={() => removeItem(item.lineId)} className="mt-3 text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground">
                      {locale === "bs" ? "Ukloni" : "Remove"}
                    </button>
                  </div>
                  <p className="hidden text-right font-medium md:block">{formatPrice(item.price * item.quantity, locale)}</p>
                </li>
              ))}
            </ul>
          </section>

          <aside className="h-fit border border-border bg-secondary/20 p-5 sm:p-7 lg:sticky lg:top-28">
            <h2 className="font-serif text-3xl">{locale === "bs" ? "Sažetak narudžbe" : "Order summary"}</h2>
            <div className="mt-7 flex items-center justify-between border-b border-border pb-5 text-sm">
              <span className="text-muted-foreground">{locale === "bs" ? "Međuzbir" : "Subtotal"}</span>
              <span className="font-serif text-2xl">{formatPrice(subtotal, locale)}</span>
            </div>
            <p className="py-5 text-xs leading-6 text-muted-foreground">
              {locale === "bs"
                ? "Dostava i konačni detalji narudžbe potvrđuju se na checkoutu."
                : "Shipping and final order details are confirmed at checkout."}
            </p>
            <Link href={checkoutHref} className="flex h-13 w-full items-center justify-center bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90">
              {locale === "bs" ? "Nastavi na checkout" : "Proceed to checkout"}
            </Link>
            <Link href={shopHref} className="mt-4 flex h-11 w-full items-center justify-center text-sm underline underline-offset-4 sm:hidden">
              {locale === "bs" ? "Nastavi kupovinu" : "Continue shopping"}
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}

function QuantityControl({ quantity, onDecrease, onIncrease, locale }: { quantity: number; onDecrease: () => void; onIncrease: () => void; locale: Locale }) {
  return (
    <div className="inline-flex items-center border border-border">
      <button type="button" onClick={onDecrease} className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-secondary" aria-label={locale === "bs" ? "Smanji količinu" : "Decrease quantity"}>
        <Minus className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <span className="flex h-10 w-10 items-center justify-center text-sm" aria-live="polite">{quantity}</span>
      <button type="button" onClick={onIncrease} className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-secondary" aria-label={locale === "bs" ? "Povećaj količinu" : "Increase quantity"}>
        <Plus className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}
