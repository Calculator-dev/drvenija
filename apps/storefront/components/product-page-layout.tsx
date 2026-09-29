import Image from "next/image"
import Link from "next/link"
import { Box, Layers3, Ruler, Sparkles } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { ProductDetail } from "@/components/product-detail"
import { ProductGallery } from "@/components/product-gallery"
import { Reveal } from "@/components/reveal"
import { buildPath, type Locale, type LocalizedProduct } from "@/lib/products"

export function ProductPageLayout({ locale, product, related }: { locale: Locale; product: LocalizedProduct; related: LocalizedProduct[] }) {
  const isBs = locale === "bs"
  const images = product.media.length ? product.media : [product.primaryImage]
  const editorialImage = images[1] ?? images[0]
  const materialName = product.material === "plexiglass" ? (isBs ? "Pleksiglas" : "Plexiglass") : product.material === "mediapan" ? (isBs ? "Mediapan" : "MDF") : (isBs ? "Kombinovano" : "Mixed")

  const highlights = [
    { icon: Ruler, title: isBs ? "Precizan CNC rez" : "Precision CNC cut", text: isBs ? "Čiste linije i dosljedne dimenzije." : "Clean lines and consistent dimensions." },
    { icon: Layers3, title: isBs ? "Odabran materijal" : "Selected material", text: product.material === "mediapan" ? (isBs ? "Mediapan spreman za urednu završnu obradu." : "MDF prepared for a clean finish.") : (isBs ? "Pleksiglas odabran za uredan i moderan izgled." : "Plexiglass selected for a crisp, modern look.") },
    { icon: Sparkles, title: isBs ? "Ručna završna obrada" : "Finished by hand", text: isBs ? "Svaki komad pregledamo prije pakovanja." : "Every piece is checked before packing." },
    { icon: Box, title: isBs ? "Sigurno pakovanje" : "Secure packaging", text: isBs ? "Pripremljeno za siguran transport do vas." : "Prepared for safe delivery to your door." },
  ]

  return (
    <article>
      <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-7 md:px-6 md:pb-24 md:pt-8">
        <nav aria-label={isBs ? "Putanja" : "Breadcrumb"} className="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-muted-foreground">
          <Link href={buildPath(locale)} className="shrink-0 transition-colors hover:text-foreground">{isBs ? "Početna" : "Home"}</Link>
          <span aria-hidden="true">›</span>
          <Link href={buildPath(locale, "/shop")} className="shrink-0 transition-colors hover:text-foreground">{isBs ? "Svi proizvodi" : "All products"}</Link>
          <span aria-hidden="true">›</span>
          <span className="truncate text-foreground">{product.localizedName}</span>
        </nav>

        <div className="mt-7 grid items-start gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] xl:gap-16">
          <ProductGallery locale={locale} images={images} />
          <div className="lg:sticky lg:top-24"><ProductDetail locale={locale} product={product} /></div>
        </div>
      </div>

      <section className="bg-black px-4 py-20 text-center text-white md:px-6 md:py-28">
        <Reveal className="mx-auto max-w-4xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/55">{product.categoryName?.[locale] ?? (isBs ? "Drvenija kolekcija" : "Drvenija collection")}</p>
          <h2 className="mt-5 text-4xl font-bold leading-tight tracking-[-0.035em] md:text-6xl">{product.localizedName}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg">{product.localizedDescription}</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-16 md:px-6 md:py-24">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{isBs ? "Kvalitet u detaljima" : "Quality in every detail"}</p>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.035em] md:text-5xl">{isBs ? "Napravljeno da traje." : "Made to last."}</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 border-l border-t border-border/60 md:grid-cols-4">
          {highlights.map((highlight, index) => (
            <Reveal key={highlight.title} delay={index * 0.05} className="h-full">
              <div className="h-full border-b border-r border-border/60 px-5 py-8 md:px-7 md:py-10">
                <highlight.icon className="h-6 w-6" strokeWidth={1.4} />
                <h3 className="mt-7 text-base font-bold md:text-lg">{highlight.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{highlight.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[#f0ece5]">
        <div className="mx-auto grid max-w-[1500px] md:grid-cols-2">
          <div className="relative min-h-[420px] md:min-h-[680px]">
            <Image unoptimized src={editorialImage.url} alt={editorialImage.alt[locale]} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <Reveal className="flex items-center px-7 py-16 md:px-14 lg:px-20">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{isBs ? "Materijal i završna obrada" : "Material and finish"}</p>
              <h2 className="mt-5 text-4xl font-bold leading-tight tracking-[-0.035em] md:text-5xl">{product.localizedTagline || (isBs ? "Preciznost koju vidite i osjetite." : "Precision you can see and feel.")}</h2>
              <p className="mt-6 text-base leading-8 text-foreground/65">{isBs ? `Komad izrađujemo od materijala: ${materialName}. CNC obrada osigurava preciznu formu, a završne detalje pregledamo i dorađujemo ručno.` : `This piece is made from ${materialName}. CNC production creates its precise form, while the finishing details are checked and completed by hand.`}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <p className="text-center text-xs uppercase tracking-[0.28em] text-muted-foreground">{isBs ? "Precizno" : "Precision"}</p>
          <h2 className="mt-4 text-center text-4xl font-bold tracking-[-0.035em] md:text-5xl">{isBs ? "Specifikacije" : "Specifications"}</h2>
          <dl className="mt-12 border-t border-border/60">
            <SpecRow label={isBs ? "Materijal" : "Material"} value={materialName} />
            <SpecRow label={isBs ? "Dimenzije" : "Dimensions"} value={product.dimensions} />
            <SpecRow label={isBs ? "Rok izrade" : "Lead time"} value={product.localizedLeadTime} />
            <SpecRow label="SKU" value={product.sku} />
            <SpecRow label={isBs ? "Dostupnost" : "Availability"} value={product.localizedStockLabel} />
            <SpecRow label={isBs ? "Personalizacija" : "Personalization"} value={product.customizable ? (isBs ? "Dostupna" : "Available") : (isBs ? "Nije dostupna" : "Not available")} />
          </dl>
        </Reveal>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border/60 bg-stone-50 py-16 md:py-24">
          <div className="mx-auto max-w-[1500px] px-4 md:px-6">
            <h2 className="text-4xl font-bold tracking-[-0.035em] md:text-5xl">{isBs ? "Povezani proizvodi" : "Related products"}</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => <ProductCard key={item.id} locale={locale} product={item} />)}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-2 border-b border-border/60 py-5 text-sm sm:grid-cols-[220px_1fr]"><dt className="font-semibold">{label}</dt><dd className="text-muted-foreground">{value}</dd></div>
}
