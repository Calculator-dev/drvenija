import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { UnsubscribePage } from "@/components/pages/unsubscribe-page"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

type Props = LocaleParams & { searchParams: Promise<{ token?: string }> }

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: "newsletter" })
  return createMetadata({ locale, path: "/newsletter/unsubscribe", title: t("unsubscribeTitle"), noIndex: true })
}

export default async function Page({ params, searchParams }: Props) {
  await resolveLocale(params)
  const token = (await searchParams).token
  return <UnsubscribePage token={typeof token === "string" ? token : ""} />
}
