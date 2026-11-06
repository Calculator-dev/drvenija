import { ChevronDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { Reveal } from "@/components/reveal"

const questions = ["production", "shipping", "payment", "personalization", "mounting", "custom"] as const

export function FaqSection({ freeFrom, fee }: { freeFrom: number; fee: number }) {
  const t = useTranslations("faq")
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
      <Reveal className="text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{t("eyebrow")}</p>
        <h2 className="mt-4 font-serif text-4xl tracking-tight md:text-5xl">{t("title")}</h2>
      </Reveal>
      <div className="mt-10 divide-y divide-border border-y border-border">
        {questions.map(key => (
          <details key={key} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold [&::-webkit-details-marker]:hidden">
              {t(`items.${key}.q`)}
              <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" strokeWidth={1.5} aria-hidden />
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{t(`items.${key}.a`, { freeFrom: String(freeFrom), fee: String(fee) })}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
