"use client"

import Link from "next/link"
import { Check, Package, Search, Star, Truck } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { buildPath, formatPrice, lookupOrder, OrderError, submitReview, type Locale, type OrderLookup, type OrderStatus } from "@/lib/products"
import { cn } from "@/lib/utils"

const steps: OrderStatus[] = ["submitted", "confirmed", "in_production", "packed", "shipped", "completed"]
/** The order line note without the internal "Variant: SKU · size" line the API adds for the workshop. */
function customerNote(note: string | null) {
  return (note ?? "").split("\n").filter(line => !line.startsWith("Variant: ")).join("\n").trim()
}

const orderNumberPattern = /^DRV-\d{6}-[A-F0-9]{8}$/i

export function OrderStatusPage({ locale, initialNumber }: { locale: Locale; initialNumber: string }) {
  const t = useTranslations("orderStatus")
  const [number, setNumber] = useState(initialNumber)
  const [email, setEmail] = useState("")
  const [order, setOrder] = useState<OrderLookup | null>(null)
  const [state, setState] = useState<"idle" | "loading" | "not_found" | "error">("idle")
  const resultHeading = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    if (order) resultHeading.current?.focus()
  }, [order])

  async function find(event?: React.FormEvent) {
    event?.preventDefault()
    if (!orderNumberPattern.test(number.trim())) {
      setState("not_found")
      return
    }
    setState("loading")
    try {
      const result = await lookupOrder({ orderNumber: number.trim().toUpperCase(), email: email.trim(), locale })
      setOrder(result)
      setState(result ? "idle" : "not_found")
    } catch {
      setState("error")
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-10 md:px-6 md:pb-28 md:pt-14">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent-ink">{t("eyebrow")}</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">{t("title")}</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{t("description")}</p>

      <form onSubmit={find} className="mt-8 grid gap-3 border border-border bg-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field id="orderNumber" label={t("orderNumber")} value={number} onChange={setNumber} placeholder="DRV-260101-1A2B3C4D" required />
        <Field id="orderEmail" label="Email" type="email" value={email} onChange={setEmail} required />
        <button type="submit" disabled={state === "loading"} className="inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60">
          <Search className="h-4 w-4" aria-hidden /> {state === "loading" ? t("searching") : t("find")}
        </button>
        {state === "not_found" && <p role="alert" className="text-sm text-destructive sm:col-span-3">{t("notFound")}</p>}
        {state === "error" && <p role="alert" className="text-sm text-destructive sm:col-span-3">{t("error")}</p>}
      </form>

      {order && (
        <section className="mt-10" aria-labelledby="order-result">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <h2 id="order-result" ref={resultHeading} tabIndex={-1} className="font-serif text-3xl outline-none">{order.orderNumber}</h2>
            <p className="text-sm text-muted-foreground">{t("placed", { date: new Date(order.createdAt).toLocaleDateString(locale === "bs" ? "bs-BA" : "en-GB") })}</p>
          </div>

          {order.status === "declined" ? (
            <div className="mt-6 border border-destructive/40 bg-destructive/5 p-5 text-sm leading-6">
              <p className="font-semibold">{t("statuses.declined")}</p>
              {order.declineReason && <p className="mt-2 text-muted-foreground">{order.declineReason}</p>}
            </div>
          ) : (
            <Timeline status={order.status} />
          )}

          {order.trackingNumber && (
            <p className="mt-6 flex items-center gap-2 border border-border bg-secondary/60 p-4 text-sm">
              <Truck className="h-4 w-4 text-accent-ink" aria-hidden /> {t("tracking")}: <strong className="font-semibold">{order.trackingNumber}</strong>
            </p>
          )}

          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_280px]">
            <ul className="divide-y divide-border border-y border-border">
              {order.items.map(item => (
                <li key={item.productId} className="py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={buildPath(locale, `/product/${item.slug}`)} className="font-serif text-xl hover:text-accent-ink">{item.name}</Link>
                      <p className="mt-1 text-sm text-muted-foreground">{t("quantity", { quantity: item.quantity })}</p>
                      {customerNote(item.personalization) && <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{customerNote(item.personalization)}</p>}
                    </div>
                    <p className="shrink-0 text-sm">{formatPrice(item.unitPrice * item.quantity, locale)}</p>
                  </div>
                  {item.reviewed && <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent-ink"><Check className="h-3.5 w-3.5" aria-hidden />{t("review.thanks")}</p>}
                  {item.canReview && <ReviewForm locale={locale} orderNumber={order.orderNumber} email={email} productId={item.productId} onDone={() => setOrder(current => current && ({ ...current, items: current.items.map(entry => entry.productId === item.productId ? { ...entry, canReview: false, reviewed: true } : entry) }))} />}
                </li>
              ))}
            </ul>
            <dl className="h-fit space-y-2.5 border border-border bg-card p-5 text-sm">
              <Row label={t("totals.products")} value={formatPrice(order.subtotal, locale)} />
              {order.discountAmount > 0 && <Row label={t("totals.discount")} value={`−${formatPrice(order.discountAmount, locale)}`} />}
              {order.giftWrapAmount > 0 && <Row label={t("totals.giftWrap")} value={formatPrice(order.giftWrapAmount, locale)} />}
              <Row label={t("totals.shipping")} value={order.shippingAmount === 0 ? t("totals.free") : formatPrice(order.shippingAmount, locale)} />
              <div className="flex justify-between border-t border-border pt-2.5 font-semibold"><dt>{t("totals.total")}</dt><dd>{formatPrice(order.total, locale)}</dd></div>
              <p className="pt-2 text-xs leading-5 text-muted-foreground">{t(`payment.${order.paymentMethod}`)} · {t(`paymentStatus.${order.paymentStatus}`)}</p>
            </dl>
          </div>
        </section>
      )}
    </div>
  )
}

function Timeline({ status }: { status: OrderStatus }) {
  const t = useTranslations("orderStatus")
  const current = steps.indexOf(status)
  return (
    <ol className="mt-8 grid grid-cols-3 gap-y-6 sm:grid-cols-6" aria-label={t("progress")}>
      {steps.map((step, index) => {
        const done = index <= current
        const Icon = step === "shipped" ? Truck : step === "packed" ? Package : Check
        return (
          <li key={step} className="relative flex flex-col items-center text-center" aria-current={index === current ? "step" : undefined}>
            {index > 0 && <span aria-hidden className={cn("absolute right-1/2 top-4.5 h-0.5 w-full -translate-y-1/2", index <= current ? "bg-accent" : "bg-border")} />}
            <span className={cn("relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2", done ? "border-accent bg-brown text-accent" : "border-border bg-background text-muted-foreground")}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className={cn("mt-2 px-1 text-xs leading-4", index === current ? "font-semibold" : done ? "" : "text-muted-foreground")}>{t(`statuses.${step}`)}</span>
          </li>
        )
      })}
    </ol>
  )
}

function ReviewForm({ locale, orderNumber, email, productId, onDone }: { locale: Locale; orderNumber: string; email: string; productId: string; onDone: () => void }) {
  const t = useTranslations("orderStatus.review")
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [authorName, setAuthorName] = useState("")
  const [body, setBody] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle")
  const [error, setError] = useState("")

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink underline-offset-4 hover:underline">
        <Star className="h-4 w-4" aria-hidden /> {t("write")}
      </button>
    )
  }

  async function send(event: React.FormEvent) {
    event.preventDefault()
    setStatus("sending")
    try {
      await submitReview({ orderNumber, email, locale, productId, authorName: authorName.trim(), rating, body: body.trim() })
      onDone()
    } catch (failure) {
      setError(failure instanceof OrderError ? failure.message : "")
      setStatus("error")
    }
  }

  return (
    <form onSubmit={send} className="mt-4 space-y-3 border border-border bg-secondary/40 p-4">
      <fieldset>
        <legend className="text-sm font-semibold">{t("rating")}</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map(value => (
            <button key={value} type="button" onClick={() => setRating(value)} aria-pressed={rating === value} aria-label={t("stars", { count: value })} className="p-0.5">
              <Star className={cn("h-7 w-7", value <= rating ? "fill-accent text-accent-ink" : "text-border")} strokeWidth={1.5} aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>
      <Field id={`review-name-${productId}`} label={t("name")} value={authorName} onChange={setAuthorName} required minLength={2} maxLength={80} />
      <div>
        <label htmlFor={`review-body-${productId}`} className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("body")}</label>
        <textarea id={`review-body-${productId}`} value={body} onChange={event => setBody(event.target.value)} required minLength={10} maxLength={2000} rows={4} className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none focus:border-foreground" />
      </div>
      <p className="text-xs text-muted-foreground">{t("moderation")}</p>
      {status === "error" && <p role="alert" className="text-sm text-destructive">{t("error")}{error ? ` (${error})` : ""}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={status === "sending"} className="h-11 bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60">{status === "sending" ? t("sending") : t("submit")}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-11 px-4 text-sm">{t("cancel")}</button>
      </div>
    </form>
  )
}

function Field({ id, label, value, onChange, ...props }: { id: string; label: string; value: string; onChange: (value: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</label>
      <input id={id} value={value} onChange={event => onChange(event.target.value)} {...props} className="mt-2 h-12 w-full border border-border bg-background px-3 text-sm outline-none focus:border-foreground" />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>
}
