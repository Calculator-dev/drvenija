import Link from "next/link"
import { headers } from "next/headers"
import { buildPath, isLocale } from "@/lib/products"

export default async function NotFound() {
  // not-found receives no params; proxy.ts forwards the resolved locale as a header.
  const header = (await headers()).get("x-locale") ?? ""
  const locale = isLocale(header) ? header : "bs"
  const bs = locale === "bs"
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">404</p>
      <h1 className="mt-4 font-serif text-5xl">{bs ? "Stranica nije pronađena" : "Page not found"}</h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        {bs ? "Ova stranica ne postoji. Vratite se na početnu ili otvorite shop." : "This page doesn't exist. Go back to the home page or browse the shop."}
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href={buildPath(locale)} className="inline-flex h-12 items-center justify-center bg-foreground px-6 text-sm tracking-wide text-background">
          {bs ? "Početna" : "Home"}
        </Link>
        <Link href={buildPath(locale, "/shop")} className="inline-flex h-12 items-center justify-center border border-border px-6 text-sm tracking-wide">
          Shop
        </Link>
      </div>
    </div>
  )
}
