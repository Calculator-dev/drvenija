import { env } from "../env.js"

type DecisionEmail = {
  to: string
  fullName: string
  orderNumber: string
  locale: "bs" | "en"
  decision: "accept" | "decline"
  reason?: string
}

type ConfirmationEmail = {
  to: string
  fullName: string
  orderNumber: string
  locale: "bs" | "en"
  items: Array<{ name: string; quantity: number; unitPrice: number }>
  totals: { subtotal: number; discountAmount: number; shippingAmount: number; giftWrapAmount: number; total: number }
  paymentMethod: "bank_transfer" | "cash_on_delivery"
  giftMessage?: string
  shipping: { address: string; city: string; postalCode?: string; country: string }
}

export type FulfilmentStatus = "in_production" | "packed" | "shipped" | "completed"

type StatusEmail = {
  to: string
  fullName: string
  orderNumber: string
  locale: "bs" | "en"
  status: FulfilmentStatus
  trackingNumber?: string | null
}

type InquiryNotification = {
  locale: "bs" | "en"
  fullName: string
  email: string
  phone?: string
  brief: string
  dimensions?: string
  deadline?: string
}

export type EmailResult = { sent: true } | { sent: false; reason: "not_configured" | "delivery_failed" }

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;",
}[character]!))

async function sendEmail(input: { to: string; subject: string; html: string; replyTo?: string }): Promise<EmailResult> {
  if (!env.RESEND_API_KEY || !env.ORDER_EMAIL_FROM) return { sent: false, reason: "not_configured" }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.ORDER_EMAIL_FROM, to: [input.to], subject: input.subject, html: input.html, ...(input.replyTo ? { reply_to: input.replyTo } : {}) }),
    })
    return response.ok ? { sent: true } : { sent: false, reason: "delivery_failed" }
  } catch {
    return { sent: false, reason: "delivery_failed" }
  }
}

/** Link to the storefront's order status page, or null when STOREFRONT_URL is not set. */
export function orderStatusLink(locale: "bs" | "en", orderNumber: string) {
  if (!env.STOREFRONT_URL) return null
  const base = env.STOREFRONT_URL.replace(/\/$/, "")
  return `${base}${locale === "en" ? "/en" : ""}/order?number=${encodeURIComponent(orderNumber)}`
}

const row = (label: string, value: string, bold = false) =>
  `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e5e5">${bold ? `<strong>${label}</strong>` : label}</td><td style="padding:10px 0;border-bottom:1px solid #e5e5e5;text-align:right">${bold ? `<strong>${value}</strong>` : value}</td></tr>`

export async function sendOrderConfirmationEmail(input: ConfirmationEmail): Promise<EmailResult> {
  const bosnian = input.locale === "bs"
  const { totals } = input
  const rows = input.items.map(item => row(`${escapeHtml(item.name)} × ${item.quantity}`, `${item.unitPrice * item.quantity} KM`)).join("")
    + (totals.discountAmount > 0 ? row(bosnian ? "Popust" : "Discount", `−${totals.discountAmount} KM`) : "")
    + (totals.giftWrapAmount > 0 ? row(bosnian ? "Poklon pakovanje" : "Gift wrapping", `${totals.giftWrapAmount} KM`) : "")
    + row(bosnian ? "Dostava" : "Delivery", totals.shippingAmount === 0 ? (bosnian ? "Besplatna" : "Free") : `${totals.shippingAmount} KM`)
    + row(bosnian ? "Ukupno" : "Total", `${totals.total} KM`, true)
  const location = [input.shipping.postalCode, input.shipping.city].filter(Boolean).join(" ")
  const payment = input.paymentMethod === "cash_on_delivery"
    ? bosnian ? "Plaćanje pouzećem — iznos plaćate kuriru pri preuzimanju." : "Cash on delivery — you pay the courier when the parcel arrives."
    : bosnian ? "Uplata na račun — podatke za uplatu šaljemo nakon što potvrdimo narudžbu." : "Bank transfer — we send payment details once we confirm the order."
  const link = orderStatusLink(input.locale, input.orderNumber)
  const subject = bosnian ? `Primili smo vašu narudžbu ${input.orderNumber}` : `We received your order ${input.orderNumber}`
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#222">
    <h1 style="font-size:26px">${bosnian ? "Hvala na narudžbi" : "Thank you for your order"}</h1>
    <p>${escapeHtml(bosnian ? `Poštovani/a ${input.fullName},` : `Dear ${input.fullName},`)}</p>
    <p>${bosnian ? "Vaša narudžba je uspješno zaprimljena. Pregledat ćemo dostupnost i javiti vam se uskoro." : "Your order has been received successfully. We will review availability and contact you shortly."}</p>
    <p><strong>${bosnian ? "Broj narudžbe" : "Order number"}:</strong> ${escapeHtml(input.orderNumber)}</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0"><tbody>${rows}</tbody></table>
    <p><strong>${bosnian ? "Plaćanje" : "Payment"}</strong><br>${payment}</p>
    ${input.giftMessage ? `<p><strong>${bosnian ? "Poruka na čestitki" : "Gift card message"}</strong><br>${escapeHtml(input.giftMessage)}</p>` : ""}
    <p><strong>${bosnian ? "Dostava" : "Shipping"}</strong><br>${escapeHtml(input.shipping.address)}<br>${escapeHtml(location)}<br>${escapeHtml(input.shipping.country)}</p>
    ${link ? `<p><a href="${link}" style="color:#59000a">${bosnian ? "Pratite status narudžbe" : "Track your order"}</a></p>` : ""}
    <p>${bosnian ? "Srdačno," : "Kind regards,"}<br>Drvenija</p>
  </div>`
  return sendEmail({ to: input.to, subject, html })
}

const statusCopy: Record<FulfilmentStatus, { bs: [string, string]; en: [string, string] }> = {
  in_production: {
    bs: ["Vaša narudžba {n} je u izradi", "Počeli smo s izradom vaše narudžbe. Javit ćemo vam se kada bude poslana."],
    en: ["Your order {n} is in production", "We have started making your order. We will let you know when it ships."],
  },
  packed: {
    bs: ["Vaša narudžba {n} je spakovana", "Narudžba je gotova i spakovana. Uskoro je predajemo kuriru."],
    en: ["Your order {n} is packed", "Your order is finished and packed. We will hand it to the courier shortly."],
  },
  shipped: {
    bs: ["Vaša narudžba {n} je poslana", "Narudžba je predana kuriru i stiže uskoro."],
    en: ["Your order {n} has shipped", "Your order is with the courier and will arrive soon."],
  },
  completed: {
    bs: ["Hvala vam — narudžba {n}", "Nadamo se da ste zadovoljni. Bilo bi nam drago da ostavite recenziju — pomaže drugim kupcima i nama."],
    en: ["Thank you — order {n}", "We hope you love it. We would be grateful for a review — it helps other customers and us."],
  },
}

export async function sendOrderStatusEmail(input: StatusEmail): Promise<EmailResult> {
  const bosnian = input.locale === "bs"
  const [subjectTemplate, message] = statusCopy[input.status][input.locale]
  const link = orderStatusLink(input.locale, input.orderNumber)
  const tracking = input.trackingNumber
    ? `<p><strong>${bosnian ? "Broj za praćenje pošiljke" : "Tracking number"}:</strong> ${escapeHtml(input.trackingNumber)}</p>`
    : ""
  const linkText = input.status === "shipped" || input.status === "completed"
    ? bosnian ? "Status narudžbe i recenzija" : "Order status and review"
    : bosnian ? "Status narudžbe" : "Order status"
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#222">
    <p>${escapeHtml(bosnian ? `Poštovani/a ${input.fullName},` : `Dear ${input.fullName},`)}</p>
    <p>${message}</p>
    ${tracking}
    ${link ? `<p><a href="${link}" style="color:#59000a">${linkText}</a></p>` : ""}
    <p>${bosnian ? "Srdačno," : "Kind regards,"}<br>Drvenija</p>
  </div>`
  return sendEmail({ to: input.to, subject: subjectTemplate.replace("{n}", input.orderNumber), html })
}

export async function sendOrderDecisionEmail(input: DecisionEmail): Promise<EmailResult> {
  const bosnian = input.locale === "bs"
  const accepted = input.decision === "accept"
  const subject = accepted
    ? bosnian ? `Narudžba ${input.orderNumber} je prihvaćena` : `Order ${input.orderNumber} has been accepted`
    : bosnian ? `Narudžba ${input.orderNumber} je odbijena` : `Order ${input.orderNumber} has been declined`
  const greeting = bosnian ? `Poštovani/a ${input.fullName},` : `Dear ${input.fullName},`
  const message = accepted
    ? bosnian
      ? "Vaša narudžba je prihvaćena. Uskoro ćemo vas kontaktirati s detaljima plaćanja i izrade."
      : "Your order has been accepted. We will contact you shortly with payment and production details."
    : bosnian
      ? `Nažalost, vaša narudžba je odbijena.<br><br><strong>Obrazloženje:</strong> ${escapeHtml(input.reason ?? "")}`
      : `Unfortunately, your order has been declined.<br><br><strong>Reason:</strong> ${escapeHtml(input.reason ?? "")}`
  const closing = bosnian ? "Srdačno,<br>Drvenija" : "Kind regards,<br>Drvenija"

  return sendEmail({ to: input.to, subject, html: `<p>${escapeHtml(greeting)}</p><p>${message}</p><p>${closing}</p>` })
}

/** Tells the shop about a new custom-work inquiry; replies go straight to the customer. */
export async function sendInquiryNotification(input: InquiryNotification): Promise<EmailResult> {
  if (!env.INQUIRY_NOTIFY_EMAIL) return { sent: false, reason: "not_configured" }
  const rows = [
    ["Ime", input.fullName], ["Email", input.email], ["Telefon", input.phone], ["Dimenzije / količina", input.dimensions],
    ["Željeni rok", input.deadline], ["Jezik", input.locale.toUpperCase()],
  ].filter((row): row is [string, string] => Boolean(row[1]))
    .map(([label, value]) => `<tr><td style="padding:6px 12px 6px 0;color:#666">${label}</td><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`).join("")
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;color:#222">
    <h1 style="font-size:22px">Novi upit za izradu po mjeri</h1>
    <table style="border-collapse:collapse">${rows}</table>
    <p style="white-space:pre-wrap;border-left:3px solid #ddd;padding-left:12px">${escapeHtml(input.brief)}</p>
  </div>`
  return sendEmail({ to: env.INQUIRY_NOTIFY_EMAIL, subject: `Novi upit: ${input.fullName}`, html, replyTo: input.email })
}
