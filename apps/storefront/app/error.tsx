"use client"
import { usePathname } from "next/navigation"
import { localeFromPath } from "@/lib/products"
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const en = localeFromPath(usePathname()) === "en"
  return <div role="alert" className="mx-auto max-w-3xl px-6 py-24 text-center"><h1 className="font-serif text-3xl">{en ? "The shop is temporarily unavailable" : "Webshop je privremeno nedostupan"}</h1><p className="mt-4">{en ? "Please try again in a moment." : "Molimo pokušajte ponovo za trenutak."}</p><button onClick={reset} className="mt-6 bg-foreground px-6 py-3 text-background">{en ? "Try again" : "Pokušaj ponovo"}</button></div>
}
