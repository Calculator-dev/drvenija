/**
 * Shop contact details. Set NEXT_PUBLIC_CONTACT_PHONE (international format, e.g. +38761234567)
 * and NEXT_PUBLIC_CONTACT_EMAIL; the phone is also used for the WhatsApp and Viber chat links.
 */
export const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+38761000000"
export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@drvenija.ba"

/** "+38761234567" → "+387 61 234 567" for display. */
export function formatPhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "")
  const match = digits.match(/^\+387(\d{2})(\d{3})(\d{3,4})$/)
  return match ? `+387 ${match[1]} ${match[2]} ${match[3]}` : phone
}

export function whatsappLink(message: string) {
  return `https://wa.me/${contactPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
}

export function viberLink() {
  return `viber://chat?number=${encodeURIComponent(contactPhone.replace(/[^\d+]/g, ""))}`
}
