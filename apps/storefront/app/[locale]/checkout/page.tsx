import type { Metadata } from "next"
import { CheckoutPage } from "@/components/pages/checkout-page"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return createMetadata({ locale: await resolveLocale(params), path: "/checkout", title: "Checkout | Drvenija", noIndex: true })
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  return <CheckoutPage locale={locale} />
}
