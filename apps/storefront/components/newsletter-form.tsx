"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { subscribeNewsletter, type Locale } from "@/lib/products"

/** Footer sign-up. Consent is an explicit, unticked checkbox. */
export function NewsletterForm({ locale }: { locale: Locale }) {
  const t = useTranslations("newsletter")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState("sending")
    try {
      await subscribeNewsletter({ email: email.trim(), locale })
      setState("done")
    } catch {
      setState("error")
    }
  }

  if (state === "done") return <p role="status" className="text-sm text-accent">{t("done")}</p>

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">Email</label>
        <input id="newsletter-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder={t("placeholder")} className="h-11 min-w-0 flex-1 rounded-sm border border-input bg-ivory/5 px-3 text-sm text-ivory outline-none placeholder:text-ivory/40 focus:border-accent" />
        <button type="submit" disabled={state === "sending" || !consent} className="h-11 shrink-0 rounded-sm bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50">{t("submit")}</button>
      </div>
      <label className="flex items-start gap-2 text-xs leading-5 text-ivory/60">
        <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required className="mt-0.5 accent-[var(--accent)]" />
        {t("consent")}
      </label>
      {state === "error" && <p role="alert" className="text-xs text-red-300">{t("error")}</p>}
    </form>
  )
}
