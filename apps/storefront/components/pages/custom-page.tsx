import { CustomForm } from "@/components/custom-form"
import { PageIntro } from "@/components/page-intro"
import { Reveal } from "@/components/reveal"
import { type Locale } from "@/lib/products"

export function CustomPage({ locale }: { locale: Locale }) {
  const isBs = locale === "bs"
  const bullets = isBs
    ? [
        "Poslovni natpisi i logo table",
        "Pokloni i event dekoracije po mjeri",
        "Mali batch proizvodi za prodaju ili promociju",
      ]
    : [
        "Business signage and logo plaques",
        "Tailored gifts and event decor",
        "Small-batch products for retail or brand promotion",
      ]

  return (
    <>
      <PageIntro
        eyebrow={isBs ? "Custom izrada" : "Custom work"}
        title={isBs ? "Pošaljite ideju, dimenziju i rok, a mi vraćamo prijedlog izvedbe." : "Send the idea, dimensions, and timing, and we will return a production-ready proposal."}
        description={
          isBs
            ? "Ovaj obrazac je namijenjen za komade koji nisu standardni artikli u webshopu: poslovne natpise, serije poklona, oznake i dekoracije po mjeri."
            : "This form is intended for pieces that are not standard webshop items: branded signs, gift batches, custom markers, and tailored decor."
        }
      />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 md:grid-cols-[0.9fr_1.1fr] md:px-6 md:pb-24">
        <Reveal>
          <div className="space-y-5 border border-border/60 p-6">
            <p className="font-serif text-3xl">{isBs ? "Šta nam pomaže da brzo odgovorimo" : "What helps us reply quickly"}</p>
            <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
              {bullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
            <p className="text-sm leading-7 text-muted-foreground">
              {isBs
                ? "Ako imate vizual, skicu ili logo, spomenite ga u opisu i napišite kako će proizvod biti korišten."
                : "If you already have a visual, sketch, or logo, mention it in the brief and describe how the product will be used."}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <CustomForm locale={locale} />
        </Reveal>
      </div>
    </>
  )
}
