import { ProductCard } from "@/components/product-card"
import { Reveal } from "@/components/reveal"
import { getFeaturedProducts } from "@/lib/catalogue"
import type { Locale } from "@/lib/products"

export async function FeaturedProducts({ locale }: { locale: Locale }) {
  const products = await getFeaturedProducts(locale)
  if (!products.length) return null
  const isBs = locale === "bs"

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">{isBs ? "Izdvojeno" : "Featured"}</p>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="max-w-2xl font-serif text-4xl leading-tight text-foreground md:text-5xl">
            {isBs ? "Proizvodi spremni za webshop i komadi koji traže vašu ideju." : "Products ready for the webshop and pieces shaped around your idea."}
          </h2>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            {isBs
              ? "Standardni artikli imaju jasnu cijenu i rok. Personalizirani proizvodi ostavljaju prostor za ime, dimenziju ili brend detalj."
              : "Standard products come with clear pricing and lead times. Personalized pieces leave space for names, sizes, or brand details."}
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product, index) => (
          <Reveal key={product.id} delay={0.05 * index}>
            <ProductCard locale={locale} product={product} priority={index < 2} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
