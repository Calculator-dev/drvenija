import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { Reveal } from "@/components/reveal"
import { getProducts } from "@/lib/catalogue"
import { buildPath, type Locale } from "@/lib/products"

const categoryTiles = [
  { image: "/images/product-name-sign.jpg", bs: "Natpisi s imenima", en: "Name signs" },
  { image: "/images/product-wall-decor.jpg", bs: "Zidne dekoracije", en: "Wall decor" },
  { image: "/images/product-topper.jpg", bs: "Dekoracije za proslave", en: "Celebration decor" },
  { image: "/images/product-photo-stand.jpg", bs: "Pokloni i uspomene", en: "Gifts and keepsakes" },
  { image: "/images/product-business-sign.jpg", bs: "Poslovni natpisi", en: "Business signage" },
  { image: "/images/product-keychain.jpg", bs: "Privjesci", en: "Keychains" },
  { image: "/images/product-numbers.jpg", bs: "Kućni brojevi", en: "House numbers" },
  { image: "/images/hero-monogram.jpg", bs: "Monogrami", en: "Monograms" },
  { image: "/images/hero-lifestyle.jpg", bs: "Za dom", en: "For the home" },
  { image: "/images/product-business-sign.jpg", bs: "Po vašoj ideji", en: "Made from your idea" },
]

const showcaseTiles = [
  { image: "/images/product-wall-decor.jpg", bs: "Detalji koji mijenjaju prostor", en: "Details that change a room" },
  { image: "/images/product-name-sign.jpg", bs: "Ime napravljeno samo za vas", en: "A name made just for you" },
  { image: "/images/product-photo-stand.jpg", bs: "Uspomene koje ostaju blizu", en: "Memories kept close" },
  { image: "/images/product-topper.jpg", bs: "Trenuci vrijedni slavlja", en: "Moments worth celebrating" },
]

export async function HomePage({ locale }: { locale: Locale }) {
  const isBs = locale === "bs"
  const products = (await getProducts(locale)).slice(0, 5)
  const shopHref = buildPath(locale, "/shop")
  const customHref = buildPath(locale, "/custom")

  return (
    <>
      <section className="relative isolate min-h-[620px] overflow-hidden bg-neutral-950 md:min-h-[760px]">
        <Image src="/images/hero-lifestyle.jpg" alt={isBs ? "Drvenija dekoracije u enterijeru" : "Drvenija decor in an interior"} fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-black/55" />
        <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-end px-4 pb-16 pt-28 md:min-h-[760px] md:items-center md:px-6 md:pb-24">
          <Reveal className="max-w-xl text-white" y={18}>
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-white/75">{isBs ? "Dizajnirano i izrađeno u Sarajevu" : "Designed and made in Sarajevo"}</p>
            <h1 className="font-serif text-4xl leading-[0.98] tracking-[-0.035em] min-[390px]:text-5xl sm:text-6xl md:text-7xl">{isBs ? "Vaša ideja, precizno izrađena." : "Your idea, precisely made."}</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/80 md:text-lg">
              {isBs ? "Dekoracije, pokloni i poslovni natpisi od pleksiglasa i mediapana — od prvog nacrta do gotovog komada." : "Decor, gifts, and business signage in plexiglass and MDF — from the first sketch to the finished piece."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={shopHref} className="inline-flex min-h-12 items-center bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/85">{isBs ? "Pogledaj proizvode" : "Shop products"}</Link>
              <Link href={customHref} className="inline-flex min-h-12 items-center border border-white/70 px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-black">{isBs ? "Pošalji svoju ideju" : "Send your idea"}</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-16 md:px-6 md:py-24">
        <Reveal><h2 className="text-center font-serif text-4xl tracking-tight md:text-5xl">{isBs ? "Šta želite da napravimo?" : "What would you like us to make?"}</h2></Reveal>
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-5">
          {categoryTiles.map((tile, index) => (
            <Reveal key={`${tile.bs}-${index}`} delay={Math.min(index * 0.035, 0.2)}>
              <Link href={index === categoryTiles.length - 1 ? customHref : shopHref} className="group block">
                <div className="relative aspect-[1.24/1] overflow-hidden bg-muted">
                  <Image src={tile.image} alt={isBs ? tile.bs : tile.en} fill sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
                </div>
                <p className="mt-3 text-center text-sm font-medium md:text-base">{isBs ? tile.bs : tile.en}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-16 md:px-6 md:pb-24">
        <Reveal>
          <div className="relative min-h-[560px] overflow-hidden bg-stone-900 md:min-h-[650px]">
            <Image src="/images/product-business-sign.jpg" alt={isBs ? "Personalizirani poslovni natpis" : "Custom business signage"} fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
            <div className="relative flex min-h-[560px] max-w-xl flex-col justify-center p-7 text-white md:min-h-[650px] md:p-16">
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">Custom studio</p>
              <h2 className="mt-5 font-serif text-5xl leading-[1.02] md:text-6xl">{isBs ? "Ne nalazite ono što ste zamislili?" : "Can’t find what you have in mind?"}</h2>
              <p className="mt-6 max-w-md text-base leading-7 text-white/80">{isBs ? "Pošaljite nam skicu, dimenzije ili samo ideju. Zajedno ćemo odabrati materijal i napraviti komad koji odgovara prostoru." : "Send us a sketch, dimensions, or simply an idea. We’ll choose the material together and make a piece that fits your space."}</p>
              <Link href={customHref} className="mt-8 inline-flex w-fit items-center gap-2 border-b border-white pb-1 text-sm font-semibold">{isBs ? "Započni custom projekat" : "Start a custom project"} <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </Reveal>
      </section>

      {products.length > 0 && (
        <section className="border-y border-border/60 bg-stone-50 py-16 md:py-24">
          <div className="mx-auto max-w-[1500px] px-4 md:px-6">
            <Reveal className="flex items-end justify-between gap-6">
              <div><p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Webshop</p><h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">{isBs ? "Svi proizvodi" : "All products"}</h2></div>
              <Link href={shopHref} className="hidden items-center gap-2 border-b border-foreground pb-1 text-sm font-medium sm:flex">{isBs ? "Pogledaj sve" : "View all"} <ArrowRight className="h-4 w-4" /></Link>
            </Reveal>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
              {products.map((product, index) => <Reveal key={product.id} delay={index * 0.05}><ProductCard locale={locale} product={product} priority={index < 2} /></Reveal>)}
            </div>
            <Link href={shopHref} className="mt-10 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-medium sm:hidden">{isBs ? "Pogledaj sve" : "View all"} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1500px] px-4 py-16 md:px-6 md:py-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{isBs ? "Ideje iz radionice" : "From the workshop"}</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight md:text-5xl">{isBs ? "Napravljeno da bude dio vaših trenutaka." : "Made to become part of your moments."}</h2>
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-2 md:gap-5">
          {showcaseTiles.map((tile, index) => (
            <Reveal key={tile.bs} delay={(index % 2) * 0.06}>
              <div className="group relative aspect-[4/3] overflow-hidden bg-muted">
                <Image src={tile.image} alt={isBs ? tile.bs : tile.en} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-20 text-white"><p className="font-serif text-2xl md:text-3xl">{isBs ? tile.bs : tile.en}</p></div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[#efe9df]">
        <div className="mx-auto grid max-w-[1500px] md:grid-cols-2">
          <div className="relative min-h-[430px] md:min-h-[620px]"><Image src="/images/hero-monogram.jpg" alt={isBs ? "Izrada Drvenija proizvoda" : "Making a Drvenija product"} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" /></div>
          <Reveal className="flex items-center px-7 py-16 md:px-16 md:py-20">
            <div className="max-w-lg">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{isBs ? "Materijal i izrada" : "Material and craft"}</p>
              <h2 className="mt-5 font-serif text-4xl leading-tight tracking-tight md:text-5xl">{isBs ? "Odaberite završnu obradu koja pristaje vašem prostoru." : "Choose a finish that belongs in your space."}</h2>
              <p className="mt-6 text-base leading-8 text-foreground/65">{isBs ? "Pleksiglas donosi čiste linije i sjaj, a mediapan toplinu i prirodan osjećaj. Svaki komad možemo prilagoditi bojom, veličinom i načinom montaže." : "Plexiglass brings crisp lines and shine, while MDF adds warmth and a natural feel. Each piece can be adjusted in color, size, and mounting style."}</p>
              <Link href={customHref} className="mt-8 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-semibold">{isBs ? "Istraži custom izradu" : "Explore custom work"} <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
