import { randomBytes } from "node:crypto"
import { z } from "zod"

/**
 * The custom "levha" (calligraphy panel) configurator: the options a customer can choose,
 * which combinations are not allowed, and how the price is worked out. The storefront keeps
 * a copy of these rules for the live preview; the API is authoritative.
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

export type BackgroundMaterial = keyof typeof backgroundOptions
export type LetterMaterial = keyof typeof letterOptions

/** Letters may not be the same colour as the background (e.g. black on black). */
export function sameColour(background: { colour: string }, letters: { colour: string }) {
  return background.colour === letters.colour
}

export type LevhaPricing = {
  /** Standard sizes in cm with their base price (plywood background and letters). */
  sizes: Array<{ width: number; height: number; price: number }>
  /** Base price for a custom size, per square metre of the panel. */
  pricePerSqm: number
  /** Surcharges in percent of the base price, by material. */
  backgroundSurchargePct: Record<BackgroundMaterial, number>
  letterSurchargePct: Record<LetterMaterial, number>
  /** Smallest custom size; larger than `maxAuto` is priced on request. */
  minWidth: number
  minHeight: number
  maxAutoWidth: number
  maxAutoHeight: number
}

/** Starting prices: black frame, black plywood and gold plexiglass letters at 80 × 40 = 100 KM. */
export const defaultLevhaPricing: LevhaPricing = {
  sizes: [
    { width: 80, height: 40, price: 80 },
    { width: 80, height: 50, price: 90 },
    { width: 100, height: 60, price: 120 },
  ],
  pricePerSqm: 250,
  backgroundSurchargePct: { plywood: 0, plexiglass: 25 },
  letterSurchargePct: { plywood: 0, mdf: 0, plexiglass: 25 },
  minWidth: 40,
  minHeight: 40,
  maxAutoWidth: 100,
  maxAutoHeight: 60,
}

const whole = z.number().int().min(0).max(1_000_000)
const cm = z.number().int().min(10).max(1000)
export const levhaPricingInput = z.object({
  sizes: z.array(z.object({ width: cm, height: cm, price: whole }).strict()).min(1).max(12),
  pricePerSqm: whole,
  backgroundSurchargePct: z.object({ plywood: z.number().int().min(-100).max(1000), plexiglass: z.number().int().min(-100).max(1000) }).strict(),
  letterSurchargePct: z.object({ plywood: z.number().int().min(-100).max(1000), mdf: z.number().int().min(-100).max(1000), plexiglass: z.number().int().min(-100).max(1000) }).strict(),
  minWidth: cm,
  minHeight: cm,
  maxAutoWidth: cm,
  maxAutoHeight: cm,
}).strict()
  .refine(value => value.maxAutoWidth >= value.minWidth && value.maxAutoHeight >= value.minHeight, { message: "The largest priced size must be at least the smallest size", path: ["maxAutoWidth"] })
  .refine(value => new Set(value.sizes.map(size => `${size.width}x${size.height}`)).size === value.sizes.length, { message: "Sizes must be different", path: ["sizes"] })

const background = z.discriminatedUnion("material", [
  z.object({ material: z.literal("plywood"), colour: z.enum(backgroundOptions.plywood) }).strict(),
  z.object({ material: z.literal("plexiglass"), colour: z.enum(backgroundOptions.plexiglass) }).strict(),
])
const letters = z.discriminatedUnion("material", [
  z.object({ material: z.literal("plywood"), colour: z.enum(letterOptions.plywood) }).strict(),
  z.object({ material: z.literal("mdf"), colour: z.enum(letterOptions.mdf) }).strict(),
  z.object({ material: z.literal("plexiglass"), colour: z.enum(letterOptions.plexiglass) }).strict(),
])

export const levhaConfiguration = z.object({
  frame: z.enum(frameColours),
  size: z.object({ width: cm, height: cm }).strict(),
  background,
  letters,
  // A predefined text, or the customer's own text and which part of it they want.
  ayahId: z.string().uuid().nullable(),
  customAyah: z.object({
    text: z.string().trim().min(2).max(2000),
    part: z.string().trim().max(500).optional().transform(value => value || undefined),
  }).strict().nullable(),
}).strict()
  .refine(value => (value.ayahId === null) !== (value.customAyah === null), { message: "Choose one text or describe your own", path: ["ayahId"] })
  .refine(value => !sameColour(value.background, value.letters), { message: "Letters cannot be the same colour as the background", path: ["letters"] })

export type LevhaConfiguration = z.infer<typeof levhaConfiguration>

/** Price in whole KM, or null when the size is priced on request. */
export function levhaPrice(pricing: LevhaPricing, configuration: Pick<LevhaConfiguration, "size" | "background" | "letters">) {
  const { width, height } = configuration.size
  if (width < pricing.minWidth || height < pricing.minHeight) return null
  const standard = pricing.sizes.find(size => size.width === width && size.height === height)
  let base: number
  if (standard) {
    base = standard.price
  } else {
    // Custom sizes up to the largest priced size (either orientation) are priced by area.
    const longest = Math.max(pricing.maxAutoWidth, pricing.maxAutoHeight)
    const shortest = Math.min(pricing.maxAutoWidth, pricing.maxAutoHeight)
    if (Math.max(width, height) > longest || Math.min(width, height) > shortest) return null
    base = (width * height / 10_000) * pricing.pricePerSqm
  }
  const surcharge = pricing.backgroundSurchargePct[configuration.background.material] + pricing.letterSurchargePct[configuration.letters.material]
  return Math.max(0, Math.round(base * (1 + surcharge / 100)))
}

export function createLevhaNumber(now = new Date()) {
  const date = now.toISOString().slice(2, 10).replaceAll("-", "")
  return `LVH-${date}-${randomBytes(3).toString("hex").toUpperCase()}`
}
