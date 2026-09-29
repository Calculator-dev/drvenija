import { CheckCircle2 } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { landingSections, type Locale } from "@/lib/products"

export function ProcessSection({ locale }: { locale: Locale }) {
  const section = landingSections.process
  const steps = locale === "bs"
    ? [
        "Definišemo dimenzije, namjenu i vizual proizvoda.",
        "Pripremamo CNC fajl i usklađujemo materijal i debljinu.",
        "Režemo, obrađujemo rubove i provjeravamo svaki komad prije slanja.",
      ]
    : [
        "We define the product use case, dimensions, and visual direction.",
        "We prepare the CNC-ready file and align material and thickness.",
        "We cut, finish the edges, and inspect each piece before dispatch.",
      ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">{section.eyebrow[locale]}</p>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="mt-4 grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <h2 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">{section.title[locale]}</h2>
          <p className="text-sm leading-7 text-muted-foreground">{section.description[locale]}</p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map((step, index) => (
          <Reveal key={step} delay={0.08 * index}>
            <div className="border border-border/60 p-6">
              <CheckCircle2 className="h-5 w-5 text-accent" strokeWidth={1.8} />
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{step}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
