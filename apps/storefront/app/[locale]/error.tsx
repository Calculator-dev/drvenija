"use client"

import { useTranslations } from "next-intl"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("error")
  return (
    <div role="alert" className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-serif text-3xl">{t("title")}</h1>
      <p className="mt-4">{t("description")}</p>
      <button onClick={reset} className="mt-6 bg-accent px-6 py-3 font-semibold text-accent-foreground hover:bg-accent-hover">{t("retry")}</button>
    </div>
  )
}
