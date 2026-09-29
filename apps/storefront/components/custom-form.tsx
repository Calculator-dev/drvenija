"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { type Locale } from "@/lib/products"

export function CustomForm({ locale }: { locale: Locale }) {
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    setSending(false)
    toast.success(locale === "bs" ? "Upit je zabilježen. Javljamo se uskoro." : "Your brief has been noted. We will reply soon.")
    event.currentTarget.reset()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 border border-border/60 bg-secondary/30 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input id="fullName" label={locale === "bs" ? "Ime i prezime" : "Full name"} required />
        <Input id="email" label="Email" type="email" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input id="phone" label={locale === "bs" ? "Telefon" : "Phone"} />
        <Input id="deadline" label={locale === "bs" ? "Željeni rok" : "Preferred deadline"} />
      </div>
      <Input id="dimensions" label={locale === "bs" ? "Dimenzije / količina" : "Dimensions / quantity"} />
      <div>
        <label htmlFor="brief" className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {locale === "bs" ? "Opis projekta" : "Project brief"}
        </label>
        <textarea
          id="brief"
          name="brief"
          required
          rows={5}
          className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
          placeholder={
            locale === "bs"
              ? "Opišite proizvod, materijal, boju, količinu i svrhu."
              : "Describe the product, material, color, quantity, and intended use."
          }
        />
      </div>
      <button type="submit" disabled={sending} className="mt-2 flex h-12 items-center justify-center bg-foreground text-sm tracking-wide text-background disabled:opacity-60">
        {sending ? (locale === "bs" ? "Slanje..." : "Sending...") : locale === "bs" ? "Pošalji upit" : "Send brief"}
      </button>
    </form>
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
        className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
      />
    </div>
  )
}
