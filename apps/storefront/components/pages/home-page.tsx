import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { ProductCard } from "@/components/product-card"
import { Reveal } from "@/components/reveal"
import { Rosette } from "@/components/rosette"
import { getCatalogue, getCategories, getProducts } from "@/lib/catalogue"
import { buildPath, type Locale, type LocalizedCategory } from "@/lib/products"

const instagramUrl = "https://www.instagram.com/drvenija/"

// Each collection links to the CRM category whose name starts with one of its keywords, if one exists.
const collections = [
  { key: "calligraphy", image: "/images/products/kursi.webp", keywords: ["kaligraf", "calligraph"] },
  { key: "ramadan", image: "/images/products/crescent.webp", keywords: ["ramazan", "ramadan", "bajram", "eid"] },
  { key: "hajj", image: "/images/products/hajj-gold.webp", keywords: ["hadž", "hadz", "hajj", "umr"] },
  { key: "family", image: "/images/products/baby.webp", keywords: ["beb", "baby", "porod", "famil"] },
  { key: "clocks", image: "/images/products/wood-clock2.webp", keywords: ["sat", "clock"] },
  { key: "business", image: "/images/products/business.webp", keywords: ["posl", "business", "logo"] },
] as const

const materials = [
  { key: "mirror", image: "/images/products/mirror-sky.webp", swatch: "bg-gold" },
  { key: "black", image: "/images/products/surah-arch.webp", swatch: "bg-black" },
  { key: "wood", image: "/images/products/wood-frame.webp", swatch: "bg-wood" },
] as const

const instagramTiles = ["wood-clock", "gold-wall", "allah-black", "mihrab-gold", "wood-frame", "hajj-gold"]

function categoryFor(categories: LocalizedCategory[], keywords: readonly string[]) {
  return categories.find(category => category.localizedName.toLocaleLowerCase().split(/\s+/).some(word => keywords.some(keyword => word.startsWith(keyword))))
}

export async function HomePage({ locale }: { locale: Locale }) {
  const t = await getTranslations("home")
  const common = await getTranslations("common")
  const [allProducts, categories, { shipping }] = await Promise.all([getProducts(locale), getCategories(locale), getCatalogue()])
  const products = [...allProducts].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 8)
  const shopHref = buildPath(locale, "/shop")
  const ramadanCategory = categoryFor(categories, collections[1].keywords)
  const customHref = buildPath(locale, "/custom")

  return (
    <>
      <section className="relative isolate overflow-hidden bg-night text-[#f4efe6]">
        <svg aria-hidden className="absolute inset-0 -z-10 h-full w-full opacity-[0.07]">
          <defs>
            <pattern id="hero-lattice" width="64" height="64" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="var(--gold)" strokeWidth="1">
                <rect x="16" y="16" width="32" height="32" />
                <rect x="16" y="16" width="32" height="32" transform="rotate(45 32 32)" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-lattice)" />
        </svg>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 md:grid-cols-[1.05fr_1fr] md:gap-14 md:px-10 md:pb-24 md:pt-22">
          <Reveal className="flex flex-col gap-7" y={18}>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              <Rosette className="h-4.5 w-4.5" />
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.01em] sm:text-6xl lg:text-[70px]">{t("hero.title")}</h1>
            <p className="max-w-130 text-base leading-7 text-[#c9c1b3] md:text-lg">{t("hero.description")}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href={shopHref} className="inline-flex min-h-13 items-center gap-2.5 rounded-full bg-gold px-6.5 text-[15px] font-bold text-accent-foreground transition-colors hover:bg-[#f0c24f]">
                {t("hero.shopCta")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={customHref} className="inline-flex min-h-13 items-center rounded-full border border-[#4a443a] px-6.5 text-[15px] font-semibold transition-colors hover:border-gold hover:text-gold">
                {t("hero.customCta")}
              </Link>
            </div>
          </Reveal>
          <div className="flex items-end justify-center gap-4.5">
            <ArchImage src="/images/products/shahada-black.webp" alt={t("hero.imageAlts.left")} className="mb-10 hidden w-[26%] opacity-90 sm:block" sizes="20vw" />
            <ArchImage src="/images/products/allah-gold.webp" alt={t("hero.imageAlts.main")} className="w-3/5 outline outline-1 outline-offset-10 outline-gold sm:w-[44%]" sizes="(min-width: 768px) 22vw, 60vw" priority />
            <ArchImage src="/images/products/mihrab-gold.webp" alt={t("hero.imageAlts.right")} className="mb-24 hidden w-[26%] opacity-90 sm:block" sizes="20vw" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 pt-16 md:px-10 md:pt-22">
        <SectionHeading eyebrow={t("collections.eyebrow")} title={t("collections.title")}>
          <Link href={shopHref} className="text-[15px] font-semibold text-gold-deep hover:text-foreground">{t("collections.viewAll")} →</Link>
        </SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-5">
          {collections.map((collection, index) => {
            const category = categoryFor(categories, collection.keywords)
            return (
              <Reveal key={collection.key} delay={Math.min(index * 0.04, 0.2)}>
                <Link href={category ? `${shopHref}?category=${category.id}` : shopHref} className="group flex flex-col gap-3.5 text-center">
                  <span className="relative block aspect-4/5 overflow-hidden rounded-t-full rounded-b-md bg-muted">
                    <Image src={collection.image} alt={t(`collections.items.${collection.key}.alt`)} fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-serif text-[19px] transition-colors group-hover:text-gold-deep">{t(`collections.items.${collection.key}.name`)}</span>
                    <span className="text-[13px] text-muted-foreground">{t(`collections.items.${collection.key}.hint`)}</span>
                  </span>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </section>

      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-24 pt-18 md:px-10">
          <SectionHeading eyebrow={t("products.eyebrow")} title={t("products.title")}>
            <nav aria-label={t("products.filterLabel")} className="flex flex-wrap gap-2">
              <FilterPill href={shopHref} selected>{t("products.all")}</FilterPill>
              <FilterPill href={`${shopHref}?material=plexiglass`}>{common("materials.plexiglass")}</FilterPill>
              <FilterPill href={`${shopHref}?material=mediapan`}>{common("materials.mediapan")}</FilterPill>
              <FilterPill href={`${shopHref}?type=custom`}>{common("productTypes.custom")}</FilterPill>
            </nav>
          </SectionHeading>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-5.5 lg:grid-cols-4">
            {products.map((product, index) => <Reveal key={product.id} delay={(index % 4) * 0.05}><ProductCard locale={locale} product={product} priority={index < 2} /></Reveal>)}
          </div>
          <div className="mt-12 flex justify-center">
            <Link href={shopHref} className="inline-flex min-h-13 items-center rounded-full bg-primary px-7.5 text-[15px] font-bold text-primary-foreground transition-colors hover:bg-[#2a2721]">{t("products.viewAll")}</Link>
          </div>
        </section>
      )}

      <section className="bg-night py-20 text-[#f4efe6] md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-10">
          <Reveal className="mb-12 max-w-160">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold">{t("materials.eyebrow")}</p>
            <h2 className="mb-4 font-serif text-[32px] leading-[1.1] md:text-[44px]">{t("materials.title")}</h2>
            <p className="text-base leading-7 text-[#c9c1b3] md:text-[17px]">{t("materials.description")}</p>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-3 md:gap-6">
            {materials.map((material, index) => (
              <Reveal key={material.key} delay={index * 0.06} className="flex flex-col gap-4.5">
                <span className="relative block aspect-[4/3.4] overflow-hidden rounded-md">
                  <Image src={material.image} alt={t(`materials.items.${material.key}.alt`)} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                </span>
                <h3 className="flex items-center gap-2.5 font-serif text-2xl">
                  <span aria-hidden className={`h-3.5 w-3.5 rounded-full border border-[#5a5448] ${material.swatch}`} />
                  {t(`materials.items.${material.key}.name`)}
                </h3>
                <p className="text-[15px] leading-6 text-[#b5ada0]">{t(`materials.items.${material.key}.text`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted py-20 md:py-26">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:grid-cols-2 md:gap-16 md:px-10">
          <div className="grid grid-cols-2 items-end gap-4.5">
            <ArchImage src="/images/products/wedding-arch.webp" alt={t("personal.imageAlts.wedding")} aspect="aspect-[4/5.2]" sizes="(min-width: 768px) 25vw, 50vw" />
            <div className="flex flex-col gap-4.5">
              <span className="relative block aspect-square overflow-hidden rounded-full">
                <Image src="/images/products/baby.webp" alt={t("personal.imageAlts.baby")} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
              </span>
              <span className="relative block aspect-4/3 overflow-hidden rounded-md">
                <Image src="/images/products/cad.webp" alt={t("personal.imageAlts.draft")} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
              </span>
            </div>
          </div>
          <Reveal className="flex flex-col gap-6.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">{t("personal.eyebrow")}</p>
            <h2 className="font-serif text-[32px] leading-[1.1] md:text-[44px]">{t("personal.title")}</h2>
            <p className="text-base leading-7 text-[#4a453d] md:text-[17px]">{t("personal.description")}</p>
            <ol className="flex flex-col gap-4.5">
              {(["choose", "write", "approve"] as const).map((step, index) => (
                <li key={step} className="flex items-start gap-4">
                  <span aria-hidden className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-night font-serif text-[17px] text-gold">{index + 1}</span>
                  <span className="pt-1.5 text-base leading-6">{t.rich(`personal.steps.${step}`, { b: chunks => <strong className="font-semibold">{chunks}</strong> })}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3">
              <Link href={`${shopHref}?type=custom`} className="inline-flex min-h-13 items-center rounded-full bg-primary px-6.5 text-[15px] font-bold text-primary-foreground transition-colors hover:bg-[#2a2721]">{t("personal.shopCta")}</Link>
              <Link href={customHref} className="inline-flex min-h-13 items-center rounded-full border border-foreground px-6.5 text-[15px] font-semibold transition-colors hover:bg-foreground hover:text-background">{t("personal.customCta")}</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-10 md:py-24">
        <Reveal>
          <div className="grid overflow-hidden rounded-xl bg-night text-[#f4efe6] md:grid-cols-2">
            <div className="flex flex-col gap-5 px-7 py-12 md:px-12 md:py-14">
              <span lang="ar" dir="rtl" className="self-start font-arabic text-[40px] leading-none text-gold">{t("seasonal.greeting")}</span>
              <h2 className="font-serif text-[32px] leading-[1.1] md:text-[44px]">{t("seasonal.title")}</h2>
              <p className="max-w-110 text-base leading-7 text-[#c9c1b3]">{t("seasonal.description")}</p>
              <Link href={ramadanCategory ? `${shopHref}?category=${ramadanCategory.id}` : shopHref} className="inline-flex min-h-13 items-center self-start rounded-full bg-gold px-6.5 text-[15px] font-bold text-accent-foreground transition-colors hover:bg-[#f0c24f]">{t("seasonal.cta")}</Link>
            </div>
            <div className="grid min-h-90 grid-cols-2 gap-1">
              <span className="relative block"><Image src="/images/products/crescent.webp" alt={t("seasonal.imageAlts.crescent")} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" /></span>
              <span className="relative block"><Image src="/images/products/ramazan-arch.webp" alt={t("seasonal.imageAlts.stand")} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" /></span>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-10 md:pb-24">
        <div className="grid gap-8 border-t border-border pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {(["local", "draft", "custom", "delivery"] as const).map(key => (
            <div key={key} className="flex flex-col gap-2.5">
              <Rosette className="h-6.5 w-6.5 text-gold-deep" />
              <h3 className="font-serif text-[21px]">{t(`promises.${key}.title`)}</h3>
              <p className="text-[15px] leading-6 text-muted-foreground">{t(`promises.${key}.text`, { amount: String(shipping.freeFrom) })}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-10 md:pb-24">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-serif text-[26px] md:text-[30px]">{t("instagram.title")} <span className="text-gold-deep">@drvenija</span></h2>
          <a href={instagramUrl} className="inline-flex min-h-11 items-center rounded-full border border-foreground px-5 text-sm font-semibold transition-colors hover:bg-foreground hover:text-background">{t("instagram.follow")}</a>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {instagramTiles.map(tile => (
            <a key={tile} href={instagramUrl} aria-label={t("instagram.tileLabel")} className="relative block aspect-square overflow-hidden rounded-sm">
              <Image src={`/images/products/${tile}.webp`} alt="" fill sizes="(min-width: 768px) 16vw, 33vw" className="object-cover transition-transform duration-500 hover:scale-[1.04]" />
            </a>
          ))}
        </div>
      </section>
    </>
  )
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">{eyebrow}</p>
        <h2 className="font-serif text-[32px] leading-[1.1] md:text-[44px]">{title}</h2>
      </div>
      {children}
    </Reveal>
  )
}

function FilterPill({ href, selected = false, children }: { href: string; selected?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={selected
        ? "inline-flex min-h-10 items-center rounded-full border border-foreground bg-foreground px-4.5 text-sm font-semibold text-background"
        : "inline-flex min-h-10 items-center rounded-full border border-input px-4.5 text-sm font-semibold transition-colors hover:border-foreground"}
    >
      {children}
    </Link>
  )
}

function ArchImage({ src, alt, className = "", aspect = "aspect-[4/5.4]", sizes, priority = false }: { src: string; alt: string; className?: string; aspect?: string; sizes: string; priority?: boolean }) {
  return (
    <span className={`relative block overflow-hidden rounded-t-full rounded-b-md ${aspect} ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </span>
  )
}
