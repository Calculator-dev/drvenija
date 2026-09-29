import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { buildPath, heroContent, type Locale } from "@/lib/products"

export function Hero({ locale }: { locale: Locale }) {
  const prefix = locale === "en" ? "/en" : ""

  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-[radial-gradient(circle_at_top_left,rgba(176,120,63,0.14),transparent_38%),linear-gradient(180deg,#f8f1e6_0%,#fffaf4_48%,#f5eee2_100%)]">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-10 md:grid-cols-12 md:items-end md:px-6 md:pb-24 md:pt-16">
        <div className="md:col-span-5">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{heroContent.eyebrow[locale]}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-4 font-serif text-5xl leading-[0.95] text-foreground md:text-7xl">
              {heroContent.title[locale]}{" "}
              <span className="text-accent">{heroContent.highlight[locale]}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
              {heroContent.description[locale]}
            </p>
          </Reveal>
          <Reveal delay={0.2} className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={`${prefix}/shop`}
              className="inline-flex h-12 items-center justify-center bg-foreground px-6 text-sm tracking-wide text-background transition-colors hover:bg-foreground/90"
            >
              {heroContent.primaryCta[locale]}
            </Link>
            <Link href={`${prefix}/custom`} className="inline-flex items-center gap-2 text-sm text-foreground">
              <span className="border-b border-foreground/30 pb-0.5">{heroContent.secondaryCta[locale]}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </Reveal>
        </div>

        <div className="md:col-span-7">
          <Reveal y={36}>
            <div className="relative aspect-[5/4] overflow-hidden rounded-sm bg-muted shadow-[0_24px_80px_rgba(41,29,18,0.14)]">
              <Image
                src="/images/hero-lifestyle.jpg"
                alt={locale === "bs" ? "Radionica sa CNC proizvodima od pleksiglasa i mediapana" : "Workshop scene with CNC-made plexiglass and MDF products"}
                fill
                priority
                sizes="(min-width: 768px) 58vw, 100vw"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJyBoZWlnaHQ9JzgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IGZpbGw9JyNlYmUxZDYnIHdpZHRoPScxMDAnIGhlaWdodD0nODAnLz48L3N2Zz4="
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 border-t border-border/60 px-4 py-6 text-sm md:grid-cols-4 md:px-6">
        {heroContent.stats.map((item, index) => (
          <Reveal key={item.label[locale]} delay={0.06 * index}>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{item.label[locale]}</p>
              <p className="mt-1 text-foreground">{item.value[locale]}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
