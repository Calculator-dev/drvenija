import { formatDate } from "./format"

/**
 * The custom "levha" (calligraphy panel) configurator, as the CRM sees it: the API's types,
 * Bosnian labels, the price rule (a copy of `levhaPrice` in apps/api/src/lib/levha.ts) and the
 * form drafts and validation for texts and prices. The API stays authoritative.
 */

export const frameColours = ["black", "wood", "white"] as const
export const backgroundOptions = {
  plywood: ["black", "white", "wood"],
  plexiglass: ["black", "gold", "gray"],
} as const
export const letterOptions = {
  plywood: ["black", "white", "wood"],
  mdf: ["raw"],
  plexiglass: ["black", "gold", "gray"],
} as const

export type FrameColour = (typeof frameColours)[number]
export type BackgroundMaterial = keyof typeof backgroundOptions
export type LetterMaterial = keyof typeof letterOptions
export const backgroundMaterials = Object.keys(backgroundOptions) as BackgroundMaterial[]
export const letterMaterials = Object.keys(letterOptions) as LetterMaterial[]

export type LevhaPricing = {
  /** Standard sizes in cm with their base price (plywood background and letters). */
  sizes: Array<{ width: number; height: number; price: number }>
  /** Base price for a custom size, per square metre of the panel. */
  /** Surcharges in percent of the base price, by material. */
  backgroundSurchargePct: Record<BackgroundMaterial, number>
  letterSurchargePct: Record<LetterMaterial, number>
  /** Smallest size a customer can ask for. Sizes other than the standard ones are requests without a price. */
  minWidth: number
  minHeight: number
}

export type LevhaConfiguration = {
  frame: FrameColour
  size: { width: number; height: number }
  background: { material: BackgroundMaterial; colour: string }
  letters: { material: LetterMaterial; colour: string }
  ayahId: string | null
  customAyah: { text: string; part?: string } | null
  /** Line under the ayah. Older requests have none. */
  subtitle?: { kind: "none" } | { kind: "translation" } | { kind: "custom"; text: string }
}

export type LevhaContactMethod = "email" | "whatsapp" | "viber"
export const contactLabels: Record<LevhaContactMethod, string> = { email: "Email", whatsapp: "WhatsApp", viber: "Viber" }

/** Link that opens a chat with the customer in the app they chose (null for email or without a phone). */
export function contactLink(method: LevhaContactMethod, phone: string | null) {
  // Local numbers (06x…) are Bosnian: replace the leading 0 with 387.
  const digits = phone?.replace(/\D/g, "").replace(/^00/, "").replace(/^0/, "387") ?? ""
  if (method === "email" || digits.length < 6) return null
  return method === "whatsapp" ? `https://wa.me/${digits}` : `viber://chat?number=%2B${digits}`
}

export type LevhaRequestStatus = "new" | "contacted" | "accepted" | "declined"

export type AdminLevhaRequest = {
  id: string
  number: string
  fullName: string
  /** Whole KM shown to the customer; null when the size is priced on request. */
  price: number | null
  status: LevhaRequestStatus
  ayahName: string | null
  /** The exact text to cut under the ayah (translation or the customer's own), or null. */
  subtitleText: string | null
  /** How the customer wants to be contacted. */
  contactMethod: LevhaContactMethod
  configuration: LevhaConfiguration
  createdAt: string
}

export type AdminLevhaRequestDetail = AdminLevhaRequest & {
  locale: "bs" | "en"
  email: string
  phone: string | null
  notes: string | null
  adminNote: string | null
  updatedAt: string
}

export type LevhaRequestUpdate = { status: LevhaRequestStatus; adminNote?: string | null }

export type LevhaImage = { id: string; url: string; width: number; height: number }

export type AdminLevhaAyah = {
  id: string
  name: { bs: string; en: string }
  arabic: string
  translation: { bs: string; en: string } | null
  imageId: string | null
  image: LevhaImage | null
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type LevhaAyahInput = {
  name: { bs: string; en: string }
  arabic: string
  translation: { bs: string; en: string } | null
  imageId: string | null
  imageAlt?: string
  active: boolean
  sortOrder: number
}

// Labels ---------------------------------------------------------------------------------

export const frameLabels: Record<FrameColour, string> = { black: "Crni", wood: "Drveni", white: "Bijeli" }
export const materialLabels: Record<BackgroundMaterial | LetterMaterial, string> = { plywood: "šperploča", plexiglass: "pleksiglas", mdf: "MDF" }
export const colourLabels: Record<string, string> = {
  black: "crna",
  white: "bijela",
  wood: "drvo",
  gold: "zlatno ogledalo",
  gray: "sivo ogledalo",
  raw: "prirodni",
}
export const requestStatusLabels: Record<LevhaRequestStatus, string> = {
  new: "Novi",
  contacted: "Kontaktiran",
  accepted: "Prihvaćen",
  declined: "Odbijen",
}
export const requestStatuses = Object.keys(requestStatusLabels) as LevhaRequestStatus[]

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
export const materialLabel = (material: string) => materialLabels[material as BackgroundMaterial] ?? material
export const colourLabel = (colour: string) => colourLabels[colour] ?? colour
export const frameLabel = (frame: string) => frameLabels[frame as FrameColour] ?? frame
export const requestStatusLabel = (status: string) => requestStatusLabels[status as LevhaRequestStatus] ?? status

/** "Šperploča, crna" */
export const materialChoiceLabel = (choice: { material: string; colour: string }) =>
  `${capitalize(materialLabel(choice.material))}, ${colourLabel(choice.colour)}`

export const sizeLabel = (size: { width: number; height: number }) => `${size.width} × ${size.height} cm`

/** Whole KM: "100 KM", "1.250 KM". */
export const wholeKm = (amount: number) => `${new Intl.NumberFormat("bs-BA", { maximumFractionDigits: 0 }).format(amount)} KM`
export const priceLabel = (price: number | null) => (price === null ? "Upit – potvrditi" : wholeKm(price))

/** Text direction for a text the customer typed: right-to-left when it contains Arabic letters. */
export const textDirection = (text: string): "rtl" | "ltr" =>
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text) ? "rtl" : "ltr"

/** Every choice of a configuration as label/value pairs, in the order the customer chose them. */
export function configurationSummary(configuration: LevhaConfiguration) {
  return [
    { label: "Okvir", value: frameLabel(configuration.frame) },
    { label: "Veličina", value: sizeLabel(configuration.size) },
    { label: "Pozadina", value: materialChoiceLabel(configuration.background) },
    { label: "Slova", value: materialChoiceLabel(configuration.letters) },
  ]
}

/** Short name of the chosen text for lists. */
export function requestTextLabel(request: Pick<AdminLevhaRequest, "ayahName" | "configuration">) {
  if (request.configuration.customAyah) {
    const text = request.configuration.customAyah.text.replace(/\s+/g, " ").trim()
    return `Vlastiti tekst: ${text.length > 40 ? `${text.slice(0, 40).trimEnd()}…` : text}`
  }
  return request.ayahName ?? "Tekst iz ponude"
}

/** Table rows, newest first. */
export function requestRows(requests: AdminLevhaRequest[]) {
  return [...requests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(request => ({
      id: request.id,
      number: request.number,
      fullName: request.fullName,
      text: requestTextLabel(request),
      size: sizeLabel(request.configuration.size),
      price: priceLabel(request.price),
      contact: contactLabels[request.contactMethod ?? "email"],
      status: requestStatusLabel(request.status),
      statusKey: request.status,
      createdAt: formatDate(request.createdAt),
    }))
}

/** The note as the API stores it: trimmed, or null when empty. */
export function requestUpdateBody(status: LevhaRequestStatus, adminNote: string): { body: LevhaRequestUpdate; error?: undefined } | { body?: undefined; error: string } {
  const note = adminNote.trim()
  if (note.length > 5000) return { error: "Interna bilješka može imati najviše 5000 znakova." }
  return { body: { status, adminNote: note || null } }
}

// Price ----------------------------------------------------------------------------------

/** Price in whole KM, or null when the size is priced on request (same as the API's `levhaPrice`). */
export function levhaPrice(
  pricing: LevhaPricing,
  configuration: { size: { width: number; height: number }; background: { material: BackgroundMaterial }; letters: { material: LetterMaterial } },
) {
  // Only standard sizes have a price; any other size is a request the shop confirms first.
  const standard = pricing.sizes.find(size => size.width === configuration.size.width && size.height === configuration.size.height)
  if (!standard) return null
  const surcharge = pricing.backgroundSurchargePct[configuration.background.material] + pricing.letterSurchargePct[configuration.letters.material]
  return Math.max(0, Math.round(standard.price * (1 + surcharge / 100)))
}

/** One worked example: the first standard size, plywood background, plexiglass letters. */
export function pricingExample(pricing: LevhaPricing) {
  const size = pricing.sizes[0]
  if (!size) return null
  const price = levhaPrice(pricing, { size, background: { material: "plywood" }, letters: { material: "plexiglass" } })
  return `Primjer: ${size.width} × ${size.height}, šperploča pozadina, pleksiglas slova = ${priceLabel(price)}`
}

/** Every standard size × background material, with the price for each letter material. */
export function combinationRows(pricing: LevhaPricing) {
  return pricing.sizes.flatMap(size => backgroundMaterials.map(background => ({
    key: `${size.width}x${size.height}-${background}`,
    size: sizeLabel(size),
    background: capitalize(materialLabel(background)),
    prices: letterMaterials.map(letters => ({
      letters,
      price: priceLabel(levhaPrice(pricing, { size, background: { material: background }, letters: { material: letters } })),
    })),
  })))
}

// Pricing form ---------------------------------------------------------------------------

export type SizeDraft = { key: string; width: string; height: string; price: string }
export type PricingDraft = {
  sizes: SizeDraft[]
  backgroundSurchargePct: Record<BackgroundMaterial, string>
  letterSurchargePct: Record<LetterMaterial, string>
  minWidth: string
  minHeight: string
}

let sizeKey = 0
export const newSizeDraft = (size?: { width: number; height: number; price: number }): SizeDraft => ({
  key: `size-${++sizeKey}`,
  width: size ? String(size.width) : "",
  height: size ? String(size.height) : "",
  price: size ? String(size.price) : "",
})

export const MAX_SIZES = 12

export function pricingDraft(pricing: LevhaPricing): PricingDraft {
  return {
    sizes: pricing.sizes.map(size => newSizeDraft(size)),
    backgroundSurchargePct: { plywood: String(pricing.backgroundSurchargePct.plywood), plexiglass: String(pricing.backgroundSurchargePct.plexiglass) },
    letterSurchargePct: { plywood: String(pricing.letterSurchargePct.plywood), mdf: String(pricing.letterSurchargePct.mdf), plexiglass: String(pricing.letterSurchargePct.plexiglass) },
    minWidth: String(pricing.minWidth),
    minHeight: String(pricing.minHeight),
  }
}

const integer = (raw: string) => {
  const text = raw.trim()
  if (!/^-?\d+$/.test(text)) return Number.NaN
  return Number(text)
}
const within = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max

/**
 * Validates the pricing form with the API's rules and builds the PUT /admin/levha/settings body.
 */
export function pricingPayload(draft: PricingDraft): { body: LevhaPricing; errors?: undefined } | { body?: undefined; errors: string[] } {
  const errors: string[] = []
  const add = (message: string) => { if (!errors.includes(message)) errors.push(message) }

  if (draft.sizes.length < 1) add("Dodajte najmanje jednu standardnu veličinu.")
  if (draft.sizes.length > MAX_SIZES) add(`Najviše ${MAX_SIZES} standardnih veličina.`)
  const sizes = draft.sizes.map((size, index) => {
    const width = integer(size.width)
    const height = integer(size.height)
    const price = integer(size.price)
    if (!within(width, 10, 1000) || !within(height, 10, 1000)) add(`Veličina ${index + 1}: širina i visina moraju biti cijeli brojevi centimetara, od 10 do 1000.`)
    if (!within(price, 0, 1_000_000)) add(`Veličina ${index + 1}: cijena mora biti cijeli iznos u KM, 0 ili više.`)
    return { width, height, price }
  })
  if (new Set(sizes.map(size => `${size.width}x${size.height}`)).size !== sizes.length) add("Standardne veličine se ne smiju ponavljati (ista širina i visina).")

  const percent = (raw: string, label: string) => {
    const value = integer(raw)
    if (!within(value, -100, 1000)) add(`Doplata za ${label} mora biti cijeli broj od −100 do 1000 %.`)
    return value
  }
  const backgroundSurchargePct = {
    plywood: percent(draft.backgroundSurchargePct.plywood, "pozadinu od šperploče"),
    plexiglass: percent(draft.backgroundSurchargePct.plexiglass, "pozadinu od pleksiglasa"),
  }
  const letterSurchargePct = {
    plywood: percent(draft.letterSurchargePct.plywood, "slova od šperploče"),
    mdf: percent(draft.letterSurchargePct.mdf, "slova od MDF-a"),
    plexiglass: percent(draft.letterSurchargePct.plexiglass, "slova od pleksiglasa"),
  }

  const cm = (raw: string, label: string) => {
    const value = integer(raw)
    if (!within(value, 10, 1000)) add(`${label} mora biti cijeli broj centimetara, od 10 do 1000.`)
    return value
  }
  const minWidth = cm(draft.minWidth, "Najmanja širina")
  const minHeight = cm(draft.minHeight, "Najmanja visina")

  if (errors.length) return { errors }
  return { body: { sizes, backgroundSurchargePct, letterSurchargePct, minWidth, minHeight } }
}

// Text (ayah) form ------------------------------------------------------------------------

export type AyahDraft = {
  nameBs: string
  nameEn: string
  arabic: string
  translationBs: string
  translationEn: string
  image: LevhaImage | null
  imageAlt: string
  sortOrder: string
  active: boolean
}

/** Next free position at the end of the list. */
export const nextSortOrder = (ayahs: Pick<AdminLevhaAyah, "sortOrder">[]) =>
  ayahs.length ? Math.min(100_000, Math.max(...ayahs.map(ayah => ayah.sortOrder)) + 1) : 0

export function ayahDraft(ayah?: AdminLevhaAyah, sortOrder = 0): AyahDraft {
  return {
    nameBs: ayah?.name.bs ?? "",
    // The API copies the Bosnian name into an empty English one; show it empty again.
    nameEn: ayah && ayah.name.en !== ayah.name.bs ? ayah.name.en : "",
    arabic: ayah?.arabic ?? "",
    translationBs: ayah?.translation?.bs ?? "",
    translationEn: ayah?.translation?.en ?? "",
    image: ayah?.image ?? null,
    imageAlt: "",
    sortOrder: String(ayah?.sortOrder ?? sortOrder),
    active: ayah?.active ?? true,
  }
}

/** Validates the text form with the API's rules and builds the POST/PUT /admin/levha/ayahs body. */
export function ayahPayload(draft: AyahDraft): { body: LevhaAyahInput; errors?: undefined } | { body?: undefined; errors: string[] } {
  const errors: string[] = []
  const bs = draft.nameBs.trim()
  const en = draft.nameEn.trim()
  const arabic = draft.arabic.trim()
  const alt = draft.imageAlt.trim()
  const translationBs = draft.translationBs.trim()
  const translationEn = draft.translationEn.trim()
  if (!bs) errors.push("Unesite naziv na bosanskom.")
  else if (bs.length > 160) errors.push("Naziv na bosanskom može imati najviše 160 znakova.")
  if (en.length > 160) errors.push("Naziv na engleskom može imati najviše 160 znakova.")
  if (!arabic) errors.push("Unesite tekst na arapskom.")
  else if (arabic.length > 5000) errors.push("Tekst na arapskom može imati najviše 5000 znakova.")
  if (translationBs.length > 150 || translationEn.length > 150) errors.push("Prijevod može imati najviše 150 znakova.")
  if (alt.length > 300) errors.push("Opis slike može imati najviše 300 znakova.")
  const sortOrder = draft.sortOrder.trim() === "" ? 0 : integer(draft.sortOrder)
  if (!within(sortOrder, 0, 100_000)) errors.push("Redoslijed mora biti cijeli broj, 0 ili više.")
  if (errors.length) return { errors }
  return {
    body: {
      name: { bs, en },
      arabic,
      // The webshop falls back to Bosnian when there is no English translation.
      translation: translationBs || translationEn ? { bs: translationBs || translationEn, en: translationEn || translationBs } : null,
      imageId: draft.image?.id ?? null,
      ...(draft.image && alt ? { imageAlt: alt } : {}),
      active: draft.active,
      sortOrder,
    },
  }
}

/** Body that only shows or hides a saved text, keeping everything else. */
export const ayahVisibilityBody = (ayah: AdminLevhaAyah, active: boolean): LevhaAyahInput => ({
  name: { bs: ayah.name.bs, en: ayah.name.en },
  arabic: ayah.arabic,
  translation: ayah.translation,
  imageId: ayah.imageId,
  active,
  sortOrder: ayah.sortOrder,
})

export function ayahSaveError(error: { message: string; status?: number }) {
  if (error.status === 409) return "Ova slika se već koristi drugdje (proizvod ili showroom). Učitajte posebnu sliku kaligrafije."
  if (error.status === 400 && /no longer exists/i.test(error.message)) return "Slika kaligrafije više ne postoji. Učitajte je ponovo."
  if (error.status === 400) return `Podaci nisu ispravni (${error.message}). Provjerite polja i pokušajte ponovo.`
  if (error.status === 404) return "Ovaj tekst više ne postoji. Osvježite stranicu."
  return error.message
}

export const ayahSortOrder = (ayahs: AdminLevhaAyah[]) =>
  [...ayahs].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))
