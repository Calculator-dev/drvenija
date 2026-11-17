import { formatDate, formatDateTime, formatMoney } from "./format"

export type DiscountKind = "percent" | "fixed"

export type AdminDiscount = {
  id: string
  code: string
  kind: DiscountKind
  value: number
  minSubtotal: number
  startsAt: string | null
  endsAt: string | null
  maxUses: number | null
  usedCount: number
  active: boolean
  createdAt: string
}

export type DiscountInput = {
  code: string
  kind: DiscountKind
  value: number
  minSubtotal: number
  startsAt: string | null
  endsAt: string | null
  maxUses: number | null
  active: boolean
}

export type DiscountStatus = "active" | "scheduled" | "expired" | "used_up" | "inactive"

const discountStatusLabels: Record<DiscountStatus, string> = {
  active: "Aktivan",
  scheduled: "Zakazan",
  expired: "Istekao",
  used_up: "Iskorišten",
  inactive: "Neaktivan",
}

/** Whether customers can use the code right now, mirroring the API's checks (minus the order subtotal). */
export function discountStatus(discount: Pick<AdminDiscount, "active" | "startsAt" | "endsAt" | "maxUses" | "usedCount">, now = new Date()): { status: DiscountStatus; label: string } {
  const status: DiscountStatus = !discount.active
    ? "inactive"
    : discount.maxUses !== null && discount.usedCount >= discount.maxUses
      ? "used_up"
      : discount.endsAt && new Date(discount.endsAt) <= now
        ? "expired"
        : discount.startsAt && new Date(discount.startsAt) > now
          ? "scheduled"
          : "active"
  return { status, label: discountStatusLabels[status] }
}

export const discountValueLabel = (discount: Pick<AdminDiscount, "kind" | "value">) =>
  discount.kind === "percent" ? `${discount.value} %` : formatMoney(discount.value)

export const discountUsageLabel = (discount: Pick<AdminDiscount, "usedCount" | "maxUses">) =>
  discount.maxUses === null ? `${discount.usedCount} / ∞` : `${discount.usedCount} / ${discount.maxUses}`

export function discountWindowLabel(discount: Pick<AdminDiscount, "startsAt" | "endsAt">) {
  if (!discount.startsAt && !discount.endsAt) return "Bez ograničenja"
  if (!discount.endsAt) return `Od ${formatDateTime(discount.startsAt!)}`
  if (!discount.startsAt) return `Do ${formatDateTime(discount.endsAt)}`
  return `${formatDateTime(discount.startsAt)} – ${formatDateTime(discount.endsAt)}`
}

const pad = (value: number) => String(value).padStart(2, "0")

/** ISO timestamp → value for an `<input type="datetime-local">` in the browser's time zone. */
export function toDateTimeLocal(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const codePattern = /^[A-Za-z0-9_-]{3,40}$/

/**
 * Validates the discount form and builds the POST/PUT /admin/discounts body.
 * Dates come from datetime-local inputs (local time) and are sent as ISO timestamps.
 */
export function discountPayload(form: FormData): { body: DiscountInput; errors?: undefined } | { body?: undefined; errors: string[] } {
  const text = (name: string) => String(form.get(name) ?? "").trim()
  const errors: string[] = []
  const code = text("code").toUpperCase()
  if (!codePattern.test(code)) errors.push("Kod mora imati 3 do 40 znakova: slova, brojevi, crtica ili donja crta.")
  const kind: DiscountKind = text("kind") === "fixed" ? "fixed" : "percent"
  const value = Number(text("value"))
  if (!Number.isInteger(value) || value < 1) errors.push("Vrijednost popusta mora biti cijeli broj veći od nule.")
  else if (kind === "percent" && value > 100) errors.push("Postotak ne može biti veći od 100.")
  const minSubtotal = text("minSubtotal") === "" ? 0 : Number(text("minSubtotal"))
  if (!Number.isInteger(minSubtotal) || minSubtotal < 0) errors.push("Minimalni iznos mora biti cijeli broj (KM), 0 ili više.")
  const maxUses = text("maxUses") === "" ? null : Number(text("maxUses"))
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) errors.push("Broj korištenja mora biti cijeli broj veći od nule ili prazno za neograničeno.")
  const date = (name: string) => {
    const raw = text(name)
    if (!raw) return null
    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) {
      errors.push("Datum nije ispravan.")
      return null
    }
    return parsed.toISOString()
  }
  const startsAt = date("startsAt")
  const endsAt = date("endsAt")
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) errors.push("Kraj važenja mora biti nakon početka.")
  if (errors.length) return { errors }
  return { body: { code, kind, value, minSubtotal, startsAt, endsAt, maxUses, active: form.has("active") } }
}

export type ReviewStatus = "pending" | "approved" | "rejected"

export type AdminReview = {
  id: string
  productId: string
  orderId: string
  authorName: string
  rating: number
  body: string
  locale: "bs" | "en"
  status: ReviewStatus
  reviewedAt: string | null
  createdAt: string
  productName: string
}

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: "Na čekanju",
  approved: "Odobrena",
  rejected: "Odbijena",
}

/** Pending reviews first, then newest first. */
export function sortReviews(reviews: AdminReview[]) {
  return [...reviews].sort((a, b) =>
    Number(b.status === "pending") - Number(a.status === "pending") ||
    b.createdAt.localeCompare(a.createdAt))
}

export const localeLabel = (locale: string) => (locale === "en" ? "Engleski" : locale === "bs" ? "Bosanski" : locale)

export type NewsletterSubscriber = { id: string; email: string; locale: "bs" | "en"; createdAt: string }

export function subscriberRows(subscribers: NewsletterSubscriber[]) {
  return subscribers.map(subscriber => ({
    id: subscriber.id,
    email: subscriber.email,
    locale: localeLabel(subscriber.locale),
    createdAt: formatDate(subscriber.createdAt),
  }))
}

// Cells starting with a formula character get a leading apostrophe so spreadsheets do not run them.
const csvCell = (raw: string) => {
  const value = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return /[",\r\n;']/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * CSV of active subscribers (email, jezik, datum). Dates are YYYY-MM-DD in UTC so the file
 * sorts and imports cleanly; cells are quoted when needed.
 */
export function subscribersCsv(subscribers: NewsletterSubscriber[]) {
  const lines = [["email", "jezik", "datum"], ...subscribers.map(subscriber => [subscriber.email, subscriber.locale, subscriber.createdAt.slice(0, 10)])]
  return `${lines.map(line => line.map(csvCell).join(",")).join("\r\n")}\r\n`
}
