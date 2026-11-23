import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LevhaConfigurator } from "@/components/levha-configurator"
import { getLevha, getShowroom } from "@/lib/catalogue"
import { resolveLocale, type LocaleParams } from "@/lib/locale-params"
import { createMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const t = await getTranslations({ locale, namespace: "levha" })
  return createMetadata({ locale, path: "/levha", title: t("metaTitle"), description: t("description") })
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params)
  const [levha, showroom] = await Promise.all([getLevha(), getShowroom()])
  return <LevhaConfigurator locale={locale} levha={levha} showroom={showroom} />
}
