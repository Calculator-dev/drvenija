"use client"

import { useState } from "react"
import { Check, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/components/cart-provider"
import { formatPrice, type Locale, type LocalizedProduct } from "@/lib/products"

export function ProductDetail({ locale, product }: { locale: Locale; product: LocalizedProduct }) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [personalization, setPersonalization] = useState("")
  const variants = (product.variants?.filter(variant => variant.active !== false) ?? []).length
    ? product.variants!.filter(variant => variant.active !== false)
    : [{ id: `${product.id}-default`, sku: product.sku, dimensions: product.dimensions, price: product.price, priceFrom: product.priceFrom }]
  const [variantId, setVariantId] = useState(() => variants.find(variant => variant.isDefault)?.id ?? variants[0]!.id)
  const selectedVariant = variants.find(variant => variant.id === variantId) ?? variants[0]!
  const materialName = product.material === "plexiglass" ? (locale === "bs" ? "Pleksiglas" : "Plexiglass") : product.material === "mediapan" ? (locale === "bs" ? "Mediapan" : "MDF") : (locale === "bs" ? "Kombinovano" : "Mixed")

  const handleAdd = () => {
    addItem(product, { quantity, personalization: personalization.trim() || undefined, variantId: selectedVariant.id })
    toast.success(locale === "bs" ? "Proizvod je dodan u korpu." : "Product added to cart.")
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {product.categoryName?.[locale] ?? ""} · {materialName}
      </p>
      <h1 className="mt-4 break-words text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground md:text-5xl">{product.localizedName}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{product.localizedTagline}</p>

      <p className="mt-5 break-all text-xs text-muted-foreground">SKU: <span className="text-foreground">{selectedVariant.sku}</span></p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <p className="text-3xl font-bold text-foreground">{selectedVariant.priceFrom ? (locale === "bs" ? "Od " : "From ") : ""}{formatPrice(selectedVariant.priceFrom ?? selectedVariant.price, locale)}</p>
        <span className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"><Check className="h-3.5 w-3.5" />{product.localizedStockLabel}</span>
      </div>

      {variants.length > 1 && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{locale === "bs" ? "Odaberite dimenzije" : "Choose dimensions"}</p>
          <div className="flex flex-wrap gap-2">
            {variants.map(variant => {
              const active = variant.id === selectedVariant.id
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  className={`border px-3 py-2 text-sm transition-colors ${active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                >
                  {variant.dimensions}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-7 border-t border-border/60 pt-7 text-sm leading-8 text-foreground/80">{product.localizedDescription}</p>

      <dl className="mt-7 grid gap-5 border-y border-border/60 py-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{locale === "bs" ? "Dimenzije" : "Dimensions"}</dt>
          <dd className="mt-1 text-foreground">{selectedVariant.dimensions}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{locale === "bs" ? "Rok izrade" : "Lead time"}</dt>
          <dd className="mt-1 text-foreground">{product.localizedLeadTime}</dd>
        </div>
      </dl>

      {product.customizable && (
        <div className="mt-7">
          <label htmlFor="personalization" className="block text-sm font-semibold">
            {locale === "bs" ? "Personalizacija" : "Personalization"}
          </label>
          <textarea
            id="personalization"
            rows={3}
            value={personalization}
            onChange={(event) => setPersonalization(event.target.value)}
            placeholder={
              locale === "bs"
                ? "Unesite ime, tekst, dimenziju ili kratku napomenu."
                : "Enter a name, wording, dimension, or short note."
            }
            className="mt-3 w-full resize-none border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
          />
        </div>
      )}

      <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row">
        <div className="inline-flex items-center justify-between border border-border sm:justify-start">
          <button type="button" className="flex h-12 w-12 items-center justify-center" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
            <Minus className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <span className="flex h-12 w-12 items-center justify-center text-sm">{quantity}</span>
          <button type="button" className="flex h-12 w-12 items-center justify-center" onClick={() => setQuantity((value) => value + 1)}>
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="min-h-12 flex-1 bg-foreground px-6 text-sm font-semibold tracking-wide text-background transition-colors hover:bg-foreground/90"
        >
          {locale === "bs" ? "Dodaj u korpu" : "Add to cart"} · {formatPrice((selectedVariant.priceFrom ?? selectedVariant.price) * quantity, locale)}
        </button>
      </div>

      <div className="mt-8 divide-y divide-border/60 border-y border-border/60 text-sm">
        <details className="group py-4" open><summary className="cursor-pointer list-none font-semibold">{locale === "bs" ? "Dostava i rok izrade" : "Delivery and lead time"}</summary><p className="mt-3 leading-6 text-muted-foreground">{locale === "bs" ? `Procijenjeni rok izrade je ${product.localizedLeadTime}. Narudžbu potvrđujemo nakon pregleda svih detalja.` : `The estimated lead time is ${product.localizedLeadTime}. We confirm the order after reviewing all details.`}</p></details>
        <details className="group py-4"><summary className="cursor-pointer list-none font-semibold">{locale === "bs" ? "Materijal i održavanje" : "Material and care"}</summary><p className="mt-3 leading-6 text-muted-foreground">{locale === "bs" ? "Čistite mekom, blago navlaženom krpom bez abrazivnih sredstava." : "Clean with a soft, lightly damp cloth without abrasive products."}</p></details>
        <details className="group py-4"><summary className="cursor-pointer list-none font-semibold">{locale === "bs" ? "Veće količine i poslovne narudžbe" : "Bulk and business orders"}</summary><p className="mt-3 leading-6 text-muted-foreground">{locale === "bs" ? "Za veće serije pripremamo posebnu ponudu i dogovaramo proizvodni rok." : "For larger batches, we prepare a tailored quote and production schedule."}</p></details>
      </div>
    </div>
  )
}
