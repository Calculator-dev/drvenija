"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { useCart } from "@/components/cart-provider"
import { Banknote, Gift, Landmark, Tag, X } from "lucide-react"
import { checkDiscount, discountAmount, formatPrice, OrderError, shippingFor, submitOrder, type AppliedDiscount, type CheckoutSettings, type DiscountRejection, type Locale, type PaymentMethod, isSvg } from "@/lib/products"
import { cn } from "@/lib/utils"

export function CheckoutClient({ locale, settings }: { locale: Locale; settings: CheckoutSettings }) {
  const router = useRouter()
  const { items, subtotal, shippingPolicy, clear } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(settings.paymentMethods[0] ?? "bank_transfer")
  const [giftWrap, setGiftWrap] = useState(false)
  const [giftMessage, setGiftMessage] = useState("")
  const [codeInput, setCodeInput] = useState("")
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null)
  const [codeError, setCodeError] = useState<{ reason: DiscountRejection; minSubtotal?: number } | null>(null)
  const [checkingCode, setCheckingCode] = useState(false)
  const t = useTranslations("checkout")
  const cart = useTranslations("cart")

  // Mirrors the API's totals: free delivery is judged after the discount.
  const discountValue = discountAmount(discount, subtotal)
  const shipping = shippingFor(subtotal - discountValue, shippingPolicy)
  const giftWrapAmount = giftWrap ? settings.giftWrapPrice : 0
  const total = subtotal - discountValue + shipping + giftWrapAmount
  const discountBelowMinimum = discount !== null && subtotal < discount.minSubtotal

  async function applyCode() {
    const code = codeInput.trim()
    if (!code) return
    setCheckingCode(true)
    const result = await checkDiscount(code, subtotal)
    setCheckingCode(false)
    if (result.ok) {
      setDiscount(result.discount)
      setCodeError(null)
      setCodeInput("")
    } else {
      setCodeError({ reason: result.reason, minSubtotal: result.minSubtotal })
    }
  }

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
        paymentMethod,
        giftWrap,
        giftMessage: giftWrap ? giftMessage.trim() || undefined : undefined,
        discountCode: discount && !discountBelowMinimum ? discount.code : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          personalization: item.personalization,
        })),
      })

      clear()
      const successBase = locale === "en" ? "/en/checkout/success" : "/checkout/success"
      router.push(`${successBase}?order=${encodeURIComponent(response.orderNumber)}`)
    } catch (error) {
      // Validation messages from the API are English; show them as detail after the localized summary.
      const detail = error instanceof OrderError && error.message !== "Order submission failed" ? ` (${error.message})` : ""
      toast.error(t("submitError") + detail)
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl border border-border/60 p-10 text-center">
        <h2 className="font-serif text-4xl">{cart("emptyTitle")}</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {t("emptyDescription")}
        </p>
        <Link
          href={locale === "en" ? "/en/shop" : "/shop"}
          className="mt-8 inline-flex h-12 items-center justify-center bg-accent px-6 text-sm font-semibold tracking-wide text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          {t("backToShop")}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 md:grid-cols-[1.15fr_0.85fr] md:px-6 md:pb-24">
      <form onSubmit={handleSubmit} className="space-y-8">
        <Section title={t("sections.contact")}>
          <Input id="fullName" label={t("fields.fullName")} required />
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="email" label="Email" type="email" required />
            <Input id="phone" label={t("fields.phone")} />
          </div>
        </Section>

        <Section title={t("sections.shipping")}>
          <Input id="address" label={t("fields.address")} required />
          <div className="grid gap-4 md:grid-cols-3">
            <Input id="city" label={t("fields.city")} required />
            <Input id="postalCode" label={t("fields.postalCode")} />
            <Input id="country" label={t("fields.country")} required defaultValue={t("fields.countryDefault")} />
          </div>
        </Section>

        <Section title={t("sections.notes")}>
          <label htmlFor="notes" className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("fields.notes")}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="mt-2 w-full border border-border bg-transparent px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            placeholder={t("fields.notesPlaceholder")}
          />
        </Section>

        <Section title={t("sections.payment")}>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("sections.payment")}>
            {settings.paymentMethods.map(method => {
              const Icon = method === "cash_on_delivery" ? Banknote : Landmark
              return (
                <label key={method} className={cn("flex cursor-pointer gap-3 border p-4 transition-colors", paymentMethod === method ? "border-foreground bg-secondary/60" : "border-border hover:border-foreground/60")}>
                  <input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="mt-1 accent-[var(--accent-ink)]" />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-accent-ink" aria-hidden />{t(`payment.${method}.title`)}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{t(`payment.${method}.text`)}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </Section>

        <Section title={t("sections.gift")}>
          <label className="flex cursor-pointer items-start gap-3 border border-border p-4">
            <input type="checkbox" checked={giftWrap} onChange={event => setGiftWrap(event.target.checked)} className="mt-1 accent-[var(--accent-ink)]" />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold"><Gift className="h-4 w-4 text-accent-ink" aria-hidden />{t("gift.label", { price: formatPrice(settings.giftWrapPrice, locale) })}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{t("gift.text")}</span>
            </span>
          </label>
          {giftWrap && (
            <div>
              <label htmlFor="giftMessage" className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("gift.messageLabel")}</label>
              <textarea id="giftMessage" rows={3} maxLength={300} value={giftMessage} onChange={event => setGiftMessage(event.target.value)} placeholder={t("gift.messagePlaceholder")} className="mt-2 w-full border border-border bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-foreground" />
            </div>
          )}
        </Section>

        <div className="border border-border/60 bg-secondary/30 p-5 text-sm leading-7 text-muted-foreground">
          {t("confirmationNote")}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center bg-accent text-sm font-semibold tracking-wide text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {submitting ? t("submitting") : t("submit", { total: formatPrice(total, locale) })}
        </button>
      </form>

      <aside className="h-fit border border-border/60 bg-background p-6 md:sticky md:top-24">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{t("summary.title")}</p>
        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.lineId} className="flex gap-3">
              <div className="relative h-20 w-16 overflow-hidden rounded-sm bg-muted">
                <Image unoptimized={isSvg(item.image)} src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t("summary.quantity", { quantity: item.quantity })}
                </p>
                {item.dimensions && <p className="mt-1 text-xs text-muted-foreground">{cart("dimensions", { dimensions: item.dimensions })}</p>}
                {item.variantSku && <p className="mt-1 text-xs text-muted-foreground">SKU: {item.variantSku}</p>}
                {item.personalization && <p className="mt-1 text-xs text-muted-foreground">{item.personalization}</p>}
              </div>
              <p className="text-sm">{formatPrice(item.price * item.quantity, locale)}</p>
            </li>
          ))}
        </ul>

        {!discount && (
          <div className="mt-6 border-t border-border/60 pt-4">
            <label htmlFor="discountCode" className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("discount.label")}</label>
            <div className="mt-2 flex gap-2">
              <input
                id="discountCode"
                value={codeInput}
                onChange={event => { setCodeInput(event.target.value); setCodeError(null) }}
                onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void applyCode() } }}
                maxLength={40}
                autoComplete="off"
                className="min-w-0 flex-1 border border-border bg-transparent px-3 py-2.5 text-sm uppercase outline-none focus:border-foreground"
                aria-describedby={codeError ? "discountError" : undefined}
              />
              <button type="button" onClick={() => void applyCode()} disabled={checkingCode || !codeInput.trim()} className="border border-foreground px-4 text-sm font-semibold transition-colors hover:bg-foreground hover:text-background disabled:opacity-50">
                {checkingCode ? "…" : t("discount.apply")}
              </button>
            </div>
            {codeError && <p id="discountError" className="mt-2 text-xs text-destructive">{t(`discount.errors.${codeError.reason}`, { amount: formatPrice(codeError.minSubtotal ?? 0, locale) })}</p>}
          </div>
        )}

        <dl className="mt-6 space-y-3 border-t border-border/60 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("summary.products")}</dt>
            <dd>{formatPrice(subtotal, locale)}</dd>
          </div>
          {discount && (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" aria-hidden />{t("summary.discount", { code: discount.code })}</span>
                <button type="button" onClick={() => setDiscount(null)} className="ml-2 inline-flex items-center align-middle text-muted-foreground hover:text-foreground" aria-label={t("discount.remove")}><X className="h-3.5 w-3.5" aria-hidden /></button>
                {discountBelowMinimum && <span className="block text-xs text-destructive">{t("discount.errors.min_subtotal", { amount: formatPrice(discount.minSubtotal, locale) })}</span>}
              </dt>
              <dd className="text-accent-ink">−{formatPrice(discountValue, locale)}</dd>
            </div>
          )}
          {giftWrapAmount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("summary.giftWrap")}</dt>
              <dd>{formatPrice(giftWrapAmount, locale)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("sections.shipping")}</dt>
            <dd>{shipping === 0 ? t("summary.free") : formatPrice(shipping, locale)}</dd>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-3">
            <dt>{t("summary.total")}</dt>
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
