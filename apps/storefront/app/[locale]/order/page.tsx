import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { OrderStatusPage } from "@/components/pages/order-status-page"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

type Props = LocaleParams & { searchParams: Promise<{ number?: string }> }

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: "meta" })
  return createMetadata({ locale, path: "/order", title: t("order"), noIndex: true })
}

export default async function Page({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const number = (await searchParams).number
  return <OrderStatusPage locale={locale} initialNumber={typeof number === "string" ? number.slice(0, 40) : ""} />
}
