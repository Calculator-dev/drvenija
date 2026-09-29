import { Reveal } from "@/components/reveal"
import { landingSections, type Locale } from "@/lib/products"

export function MaterialsSection({ locale }: { locale: Locale }) {
  const section = landingSections.materials
  const cards = locale === "bs"
    ? [
        { title: "Pleksiglas", text: "Za čiste rubove, sjajnu površinu i moderan vizual u poslovnim i event proizvodima." },
        { title: "Mediapan", text: "Za topliji izgled, lakše bojenje i dekorativne komade sa više taktilnosti." },
        { title: "Završna obrada", text: "Rubove i površine pripremamo tako da proizvod izgleda uredno i na polici i na fotografiji." },
      ]
    : [
        { title: "Plexiglass", text: "For crisp edges, polished surfaces, and a modern visual language in branded and event products." },
        { title: "MDF", text: "For a warmer look, easier finishing, and decorative pieces with more tactile depth." },
        { title: "Finishing", text: "Edges and surfaces are prepared so each product looks clean both on a shelf and in product photos." },
      ]

  return (
    <section className="bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">{section.eyebrow[locale]}</p>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="mt-4 grid gap-8 md:grid-cols-[1.3fr_1fr]">
            <h2 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">{section.title[locale]}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{section.description[locale]}</p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((card, index) => (
            <Reveal key={card.title} delay={0.08 * index}>
              <div className="min-h-52 border border-border/60 bg-background p-6">
                <p className="font-serif text-2xl text-foreground">{card.title}</p>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{card.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
