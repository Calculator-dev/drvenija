export type Locale = "bs" | "en"

export type LocalizedField = Record<Locale, string>

export type Material = "plexiglass" | "mediapan" | "mixed"

export type ProductType = "standard" | "custom"

export type ProductVariant = {
  id: string
  sku: string
  dimensions: string
  price: number
  priceFrom?: number
  isDefault?: boolean
  active?: boolean
}

export type SeoFields = {
  title: LocalizedField
  description: LocalizedField
}

export type MediaAsset = {
  id: string
  alt: LocalizedField
  url: string
  width: number
  height: number
  blurDataURL?: string
  storageKey: string
  mimeType: string
}

export type Category = {
  id: string
  slug: LocalizedField
  name: LocalizedField
  description: LocalizedField
  seo: SeoFields
}

export type Product = {
  id: string
  sku: string
  type: ProductType
  featured: boolean
  customizable: boolean
  price: number
  priceFrom?: number
  currency: "BAM"
  material: Material
  dimensions: string
  leadTime: LocalizedField
  categoryName?: LocalizedField
  categoryId: string
  stockLabel: LocalizedField
  slug: LocalizedField
  name: LocalizedField
  tagline: LocalizedField
  shortDescription: LocalizedField
  description: LocalizedField
  variants?: ProductVariant[]
  seo: SeoFields
  media: MediaAsset[]
}

export type LocalizedCategory = Category & {
  localizedSlug: string
  localizedName: string
  localizedDescription: string
}

export type LocalizedProduct = Product & {
  localizedSlug: string
  localizedName: string
  localizedTagline: string
  localizedShortDescription: string
  localizedDescription: string
  localizedLeadTime: string
  localizedStockLabel: string
  primaryImage: MediaAsset
}

export type LandingSection = {
  eyebrow: LocalizedField
  title: LocalizedField
  description: LocalizedField
}

export type HeroContent = {
  eyebrow: LocalizedField
  title: LocalizedField
  highlight: LocalizedField
  description: LocalizedField
  primaryCta: LocalizedField
  secondaryCta: LocalizedField
  stats: Array<{
    label: LocalizedField
    value: LocalizedField
  }>
}

export type ShippingPolicy = { freeFrom: number; fee: number }

/** Shown before the live policy loads; the API's GET /public/catalogue is authoritative. */
export const defaultShippingPolicy: ShippingPolicy = { freeFrom: 150, fee: 10 }

export function shippingFor(subtotal: number, policy: ShippingPolicy) {
  return subtotal === 0 || subtotal >= policy.freeFrom ? 0 : policy.fee
}

/** Live price data for cart repricing: active variants per product, default variant first. */
export type CatalogueOffer = {
  productId: string
  variants: Array<Pick<ProductVariant, "id" | "sku" | "dimensions" | "price">>
}

export function activeVariants(product: Product): Array<Pick<ProductVariant, "id" | "sku" | "dimensions" | "price" | "priceFrom" | "isDefault">> {
  const active = product.variants?.filter(variant => variant.active !== false) ?? []
  if (!active.length) return [{ id: `${product.id}-default`, sku: product.sku, dimensions: product.dimensions, price: product.price, priceFrom: product.priceFrom, isDefault: true }]
  return [...active].sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)))
}

/**
 * The listed price is what an order is charged (the variant price). "From" is shown when the
 * final price may vary: several variant prices, or a product marked with a starting price.
 */
export function displayPrice(product: Product) {
  const variants = activeVariants(product)
  const prices = variants.map(variant => variant.price)
  const amount = Math.min(...prices)
  return { amount, from: new Set(prices).size > 1 || variants.some(variant => variant.priceFrom != null) }
}

export const locales: Locale[] = ["bs", "en"]
export const defaultLocale: Locale = "bs"

export const siteName = "Drvenija"

export const siteDescription: LocalizedField = {
  bs: "Drvenija izrađuje CNC proizvode od pleksiglasa i mediapana za dom, biznis i posebne prilike.",
  en: "Drvenija creates CNC-cut plexiglass and MDF products for homes, businesses, and special occasions.",
}

export const heroContent: HeroContent = {
  eyebrow: {
    bs: "CNC radionica za pleksiglas i mediapan",
    en: "CNC studio for plexiglass and MDF",
  },
  title: {
    bs: "Proizvodi koje režemo precizno, a završavamo ručno.",
    en: "Products cut with precision and finished by hand.",
  },
  highlight: {
    bs: "za dom, poklone i biznis",
    en: "for homes, gifts, and businesses",
  },
  description: {
    bs: "Drvenija izrađuje personalizirane i serijske komade od pleksiglasa i mediapana. Fokus nam je na čistom rezu, dobrom materijalu i urednoj završnoj obradi spremnoj za prodaju ili poklon.",
    en: "Drvenija makes personalized and small-batch products in plexiglass and MDF. We focus on clean cuts, quality material choices, and a polished finish ready for retail, gifting, or interior use.",
  },
  primaryCta: {
    bs: "Pregledaj webshop",
    en: "Browse the webshop",
  },
  secondaryCta: {
    bs: "Zatraži custom izradu",
    en: "Request a custom piece",
  },
  stats: [
    {
      label: { bs: "Materijali", en: "Materials" },
      value: { bs: "Pleksiglas i mediapan", en: "Plexiglass and MDF" },
    },
    {
      label: { bs: "Tip narudžbi", en: "Order mode" },
      value: { bs: "Standardno i po mjeri", en: "Standard and custom" },
    },
    {
      label: { bs: "Prosječna izrada", en: "Typical lead time" },
      value: { bs: "2 do 8 radnih dana", en: "2 to 8 business days" },
    },
    {
      label: { bs: "Dostava", en: "Delivery" },
      value: { bs: "BiH i inostranstvo", en: "Bosnia and abroad" },
    },
  ],
}

export const landingSections: Record<"materials" | "process" | "custom", LandingSection> = {
  materials: {
    eyebrow: { bs: "Materijali", en: "Materials" },
    title: {
      bs: "Biramo površine koje izgledaju uredno i na fotografiji i uživo.",
      en: "We choose surfaces that look clean both in photos and in person.",
    },
    description: {
      bs: "Pleksiglas koristimo za sjajne, moderne i precizne detalje, dok mediapan daje topliju teksturu, lakše farbanje i fleksibilnost za enterijerske komade.",
      en: "Plexiglass is used for crisp, polished pieces, while MDF brings warmth, easier finishing, and flexibility for interior products.",
    },
  },
  process: {
    eyebrow: { bs: "Proces", en: "Process" },
    title: {
      bs: "Od ideje do gotovog komada bez improvizacije u zadnjem koraku.",
      en: "From first idea to finished piece without last-minute improvisation.",
    },
    description: {
      bs: "Prvo usklađujemo dimenzije i primjenu, zatim pripremamo fajl za CNC obradu, završavamo rubove i provjeravamo svaki komad prije pakovanja.",
      en: "We first align size and intended use, prepare the CNC-ready file, finish the edges, and inspect each piece before packing.",
    },
  },
  custom: {
    eyebrow: { bs: "Custom izrada", en: "Custom work" },
    title: {
      bs: "Ako imate ideju, možemo je pretvoriti u prodajni ili dekorativni proizvod.",
      en: "If you have an idea, we can turn it into a sellable or decorative product.",
    },
    description: {
      bs: "Za biznise i posebne događaje nudimo prilagođene natpise, oznake, poklone i serije proizvoda sa jasnim rokovima i materijalnim prijedlogom.",
      en: "For businesses and special events, we offer tailored signs, branded pieces, gifts, and small-batch production with clear timelines and material guidance.",
    },
  },
}

export function getLocalizedField(field: LocalizedField, locale: Locale) {
  return field[locale] ?? field[defaultLocale]
}

export function localizeCategory(category: Category, locale: Locale): LocalizedCategory {
  return {
    ...category,
    localizedSlug: getLocalizedField(category.slug, locale),
    localizedName: getLocalizedField(category.name, locale),
    localizedDescription: getLocalizedField(category.description, locale),
  }
}

export function localizeProduct(product: Product, locale: Locale): LocalizedProduct {
  return {
    ...product,
    localizedSlug: getLocalizedField(product.slug, locale),
    localizedName: getLocalizedField(product.name, locale),
    localizedTagline: getLocalizedField(product.tagline, locale),
    localizedShortDescription: getLocalizedField(product.shortDescription, locale),
    localizedDescription: getLocalizedField(product.description, locale),
    localizedLeadTime: getLocalizedField(product.leadTime, locale),
    localizedStockLabel: getLocalizedField(product.stockLabel, locale),
    primaryImage: product.media[0] ?? { id: "placeholder", url: "/placeholder.svg", width: 800, height: 1000, alt: product.name, storageKey: "", mimeType: "image/svg+xml" },
  }
}

export function formatPrice(amount: number, locale: Locale) {
  const rounded = Math.round(amount)
  const separator = locale === "bs" ? "." : ","
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  const value = `${rounded < 0 ? "-" : ""}${digits}`
  return locale === "bs" ? `${value} KM` : `BAM ${value}`
}

export function buildPath(locale: Locale, path = "") {
  if (locale === "en") {
    return `/en${path}`
  }

  return path || "/"
}

export type CheckoutLineItem = {
  productId: string
  variantId?: string
  quantity: number
  personalization?: string
}

export type OrderPayload = {
  locale: Locale
  customer: {
    fullName: string
    email: string
    phone?: string
  }
  shipping: {
    address: string
    city: string
    postalCode?: string
    country: string
  }
  notes?: string
  items: CheckoutLineItem[]
}

export type OrderResponse = {
  orderNumber: string
  subtotal: number
  shippingAmount: number
  total: number
}

export class OrderError extends Error {}

export async function submitOrder(payload: OrderPayload): Promise<OrderResponse> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000")).replace(/\/$/, "")
  if (!apiUrl) throw new OrderError("Order service is not configured")

  const response = await fetch(`${apiUrl}/public/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => null) as (Partial<OrderResponse> & { message?: string }) | null
  if (!response.ok || !body?.orderNumber) throw new OrderError(body?.message ?? "Order submission failed")
  return body as OrderResponse
}
