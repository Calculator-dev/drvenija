"use client"

import { usePathname } from "next/navigation"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { defaultLocale, type Locale } from "@/lib/products"

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale: Locale = pathname.startsWith("/en") ? "en" : defaultLocale

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={locale} />
    </>
  )
}
