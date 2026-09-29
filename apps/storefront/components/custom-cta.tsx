import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { landingSections, type Locale } from "@/lib/products"

export function CustomCTA({ locale }: { locale: Locale }) {
  const section = landingSections.custom
  const href = locale === "en" ? "/en/custom" : "/custom"

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <Reveal>
        <div className="grid gap-8 border border-border/60 bg-[linear-gradient(135deg,rgba(255,250,244,1),rgba(245,236,226,1))] p-8 md:grid-cols-[1.3fr_1fr] md:p-12">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">{section.eyebrow[locale]}</p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-tight text-foreground md:text-5xl">{section.title[locale]}</h2>
          </div>
          <div>
            <p className="text-sm leading-7 text-muted-foreground">{section.description[locale]}</p>
            <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm text-foreground">
              <span className="border-b border-foreground/40 pb-0.5">{locale === "bs" ? "Pošalji custom upit" : "Send a custom brief"}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
