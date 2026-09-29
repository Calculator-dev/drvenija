import { PageIntro } from "@/components/page-intro"
import { ProcessSection } from "@/components/process-section"
import { Reveal } from "@/components/reveal"
import { type Locale } from "@/lib/products"

export function AboutPage({ locale }: { locale: Locale }) {
  const isBs = locale === "bs"
  const values = isBs
    ? [
        { title: "Preciznost", text: "Svaki komad počinje jasnim tehničkim crtežom i završava ručnom provjerom prije slanja." },
        { title: "Prilagodljivost", text: "Radimo i pojedinačne custom komade i manje serije za prodaju, evente i poslovne prostore." },
        { title: "Brzina", text: "Rokove postavljamo realno i komuniciramo ih rano, posebno za poslovne i sezonske narudžbe." },
      ]
    : [
        { title: "Precision", text: "Each piece starts with a clear technical drawing and ends with a manual quality check before dispatch." },
        { title: "Flexibility", text: "We handle both one-off custom pieces and small-batch production for retail, events, and interiors." },
        { title: "Speed", text: "Lead times are set realistically and communicated early, especially for business and seasonal work." },
      ]

  return (
    <>
      <PageIntro
        eyebrow={isBs ? "O nama" : "About"}
        title={isBs ? "Mala radionica sa ozbiljnim fokusom na završni rezultat." : "A compact studio with serious attention to the final result."}
        description={
          isBs
            ? "Drvenija kombinuje CNC preciznost i ručnu završnu obradu za proizvode koji trebaju izgledati čisto, prodajno i dugotrajno."
            : "Drvenija combines CNC precision and hand finishing to create products that need to look polished, sellable, and durable."
        }
      />

      <div className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 md:grid-cols-3 md:px-6 md:pb-24">
        {values.map((value, index) => (
          <Reveal key={value.title} delay={0.06 * index}>
            <div className="border border-border/60 p-6">
              <p className="font-serif text-2xl">{value.title}</p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{value.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <ProcessSection locale={locale} />
    </>
  )
}
