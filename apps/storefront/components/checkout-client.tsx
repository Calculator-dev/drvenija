"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useCart } from "@/components/cart-provider"
import { formatPrice, submitOrder, type Locale } from "@/lib/products"

export function CheckoutClient({ locale }: { locale: Locale }) {
  const router = useRouter()
  const { items, subtotal, clear } = useCart()
  const [submitting, setSubmitting] = useState(false)

  const shipping = subtotal >= 150 || subtotal === 0 ? 0 : 10
  const total = subtotal + shipping

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (items.length === 0) return

    const formData = new FormData(event.currentTarget)
    setSubmitting(true)

    try {
      const response = await submitOrder({
        locale,
        customer: {
          fullName: String(formData.get("fullName") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
        },
        shipping: {
          address: String(formData.get("address") ?? ""),
          city: String(formData.get("city") ?? ""),
          postalCode: String(formData.get("postalCode") ?? ""),
          country: String(formData.get("country") ?? ""),
        },
        notes: String(formData.get("notes") ?? ""),
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          personalization: item.personalization,
        })),
      })

      clear()
      const successBase = locale === "en" ? "/en/checkout/success" : "/checkout/success"
      router.push(`${successBase}?order=${encodeURIComponent(response.orderNumber ?? "DRV-DEMO")}`)
    } catch (error) {
      toast.error(locale === "bs" ? "Narudžba nije poslana. Pokušajte ponovo." : "Order submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl border border-border/60 p-10 text-center">
        <h2 className="font-serif text-4xl">{locale === "bs" ? "Korpa je prazna" : "Your cart is empty"}</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {locale === "bs"
            ? "Dodajte proizvode prije nego što nastavite na checkout."
            : "Add products before continuing to checkout."}
        </p>
        <Link
          href={locale === "en" ? "/en/shop" : "/shop"}
          className="mt-8 inline-flex h-12 items-center justify-center bg-foreground px-6 text-sm tracking-wide text-background"
        >
          {locale === "bs" ? "Nazad na shop" : "Back to shop"}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 md:grid-cols-[1.15fr_0.85fr] md:px-6 md:pb-24">
      <form onSubmit={handleSubmit} className="space-y-8">
        <Section title={locale === "bs" ? "Kontakt" : "Contact"}>
          <Input id="fullName" label={locale === "bs" ? "Ime i prezime" : "Full name"} required />
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="email" label="Email" type="email" required />
            <Input id="phone" label={locale === "bs" ? "Telefon" : "Phone"} />
          </div>
        </Section>

        <Section title={locale === "bs" ? "Dostava" : "Shipping"}>
          <Input id="address" label={locale === "bs" ? "Adresa" : "Address"} required />
          <div className="grid gap-4 md:grid-cols-3">
            <Input id="city" label={locale === "bs" ? "Grad" : "City"} required />
            <Input id="postalCode" label={locale === "bs" ? "Poštanski broj" : "Postal code"} />
            <Input id="country" label={locale === "bs" ? "Država" : "Country"} required defaultValue={locale === "bs" ? "Bosna i Hercegovina" : "Bosnia and Herzegovina"} />
          </div>
        </Section>

        <Section title={locale === "bs" ? "Napomena" : "Notes"}>
          <label htmlFor="notes" className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {locale === "bs" ? "Dodatne informacije" : "Additional information"}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="mt-2 w-full border border-border bg-transparent px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            placeholder={locale === "bs" ? "Napomena za dostavu, personalizaciju ili potvrdu narudžbe." : "Any extra note for delivery, personalization, or order confirmation."}
          />
        </Section>

        <div className="border border-border/60 bg-secondary/30 p-5 text-sm leading-7 text-muted-foreground">
          {locale === "bs"
            ? "Nakon slanja narudžbe kontaktirat ćemo vas radi potvrde dostupnosti, ukupnog iznosa dostave i detalja manualnog plaćanja."
            : "After the order is submitted, we will contact you to confirm availability, final delivery cost, and manual payment details."}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center bg-foreground text-sm tracking-wide text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
        >
          {submitting
            ? locale === "bs"
              ? "Slanje..."
              : "Submitting..."
            : locale === "bs"
              ? `Pošalji narudžbu · ${formatPrice(total, locale)}`
              : `Submit order · ${formatPrice(total, locale)}`}
        </button>
      </form>

      <aside className="h-fit border border-border/60 bg-background p-6 md:sticky md:top-24">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{locale === "bs" ? "Sažetak" : "Summary"}</p>
        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.lineId} className="flex gap-3">
              <div className="relative h-20 w-16 overflow-hidden rounded-sm bg-muted">
                <Image unoptimized src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {locale === "bs" ? "Količina" : "Qty"} {item.quantity}
                </p>
                {item.dimensions && <p className="mt-1 text-xs text-muted-foreground">{locale === "bs" ? "Dimenzije" : "Dimensions"}: {item.dimensions}</p>}
                {item.variantSku && <p className="mt-1 text-xs text-muted-foreground">SKU: {item.variantSku}</p>}
                {item.personalization && <p className="mt-1 text-xs text-muted-foreground">{item.personalization}</p>}
              </div>
              <p className="text-sm">{formatPrice(item.price * item.quantity, locale)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-3 border-t border-border/60 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{locale === "bs" ? "Proizvodi" : "Products"}</dt>
            <dd>{formatPrice(subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{locale === "bs" ? "Dostava" : "Shipping"}</dt>
            <dd>{shipping === 0 ? (locale === "bs" ? "Gratis" : "Free") : formatPrice(shipping, locale)}</dd>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-3">
            <dt>{locale === "bs" ? "Ukupno" : "Total"}</dt>
            <dd className="font-serif text-2xl">{formatPrice(total, locale)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function Input({
  id,
  label,
  ...props
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        name={id}
        {...props}
        className="mt-2 w-full border border-border bg-transparent px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
      />
    </div>
  )
}
