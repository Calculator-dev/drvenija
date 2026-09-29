import { notFound } from "next/navigation"
import { isLocale, locales, type Locale } from "./products"

export type LocaleParams = { params: Promise<{ locale: string }> }

/** Resolves the [locale] segment; proxy.ts only ever routes "bs" and "en" here. */
export async function resolveLocale(params: LocaleParams["params"]): Promise<Locale> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return locale
}

export function generateLocaleParams() {
  return locales.map(locale => ({ locale }))
}
