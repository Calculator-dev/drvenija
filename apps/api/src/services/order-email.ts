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
  shippingAmount: number
  shipping: { address: string; city: string; postalCode?: string; country: string }
}

export type EmailResult = { sent: true } | { sent: false; reason: "not_configured" | "delivery_failed" }

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;",
}[character]!))

async function sendEmail(input: { to: string; subject: string; html: string }): Promise<EmailResult> {
  if (!env.RESEND_API_KEY || !env.ORDER_EMAIL_FROM) return { sent: false, reason: "not_configured" }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.ORDER_EMAIL_FROM, to: [input.to], subject: input.subject, html: input.html }),
    })
    return response.ok ? { sent: true } : { sent: false, reason: "delivery_failed" }
  } catch {
    return { sent: false, reason: "delivery_failed" }
  }
}

export async function sendOrderConfirmationEmail(input: ConfirmationEmail): Promise<EmailResult> {
  const bosnian = input.locale === "bs"
  const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const total = subtotal + input.shippingAmount
  const rows = input.items.map(item => `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e5e5">${escapeHtml(item.name)} × ${item.quantity}</td><td style="padding:10px 0;border-bottom:1px solid #e5e5e5;text-align:right">${item.unitPrice * item.quantity} KM</td></tr>`).join("")
    + `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e5e5">${bosnian ? "Dostava" : "Delivery"}</td><td style="padding:10px 0;border-bottom:1px solid #e5e5e5;text-align:right">${input.shippingAmount === 0 ? (bosnian ? "Besplatna" : "Free") : `${input.shippingAmount} KM`}</td></tr>`
  const location = [input.shipping.postalCode, input.shipping.city].filter(Boolean).join(" ")
  const subject = bosnian ? `Primili smo vašu narudžbu ${input.orderNumber}` : `We received your order ${input.orderNumber}`
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#222">
    <h1 style="font-size:26px">${bosnian ? "Hvala na narudžbi" : "Thank you for your order"}</h1>
    <p>${escapeHtml(bosnian ? `Poštovani/a ${input.fullName},` : `Dear ${input.fullName},`)}</p>
    <p>${bosnian ? "Vaša narudžba je uspješno zaprimljena. Pregledat ćemo dostupnost i javiti vam se uskoro." : "Your order has been received successfully. We will review availability and contact you shortly."}</p>
    <p><strong>${bosnian ? "Broj narudžbe" : "Order number"}:</strong> ${escapeHtml(input.orderNumber)}</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0"><tbody>${rows}<tr><td style="padding-top:14px"><strong>${bosnian ? "Ukupno" : "Total"}</strong></td><td style="padding-top:14px;text-align:right"><strong>${total} KM</strong></td></tr></tbody></table>
    <p><strong>${bosnian ? "Dostava" : "Shipping"}</strong><br>${escapeHtml(input.shipping.address)}<br>${escapeHtml(location)}<br>${escapeHtml(input.shipping.country)}</p>
    <p>${bosnian ? "Srdačno," : "Kind regards,"}<br>Drvenija</p>
  </div>`
  return sendEmail({ to: input.to, subject, html })
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
