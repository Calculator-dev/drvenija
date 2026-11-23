/**
 * The custom levha configurator: options, blocked combinations and pricing. Mirrors
 * apps/api/src/lib/levha.ts; the API recalculates the price when a request is sent.
 */
import { browserApiUrl, OrderError, type Locale } from "./products"

export const frameColours = ["black", "wood", "white"] as const
export const backgroundOptions = { plywood: ["black", "white", "wood"], plexiglass: ["black", "gold", "gray"] } as const
export const letterOptions = { plywood: ["black", "white", "wood"], mdf: ["raw"], plexiglass: ["black", "gold", "gray"] } as const

export type FrameColour = (typeof frameColours)[number]
export type BackgroundMaterial = keyof typeof backgroundOptions
export type LetterMaterial = keyof typeof letterOptions
export type Background = { [M in BackgroundMaterial]: { material: M; colour: (typeof backgroundOptions)[M][number] } }[BackgroundMaterial]
export type Letters = { [M in LetterMaterial]: { material: M; colour: (typeof letterOptions)[M][number] } }[LetterMaterial]
export type LevhaColour = Background["colour"] | Letters["colour"]

export type LevhaPricing = {
  sizes: Array<{ width: number; height: number; price: number }>
  pricePerSqm: number
  backgroundSurchargePct: Record<BackgroundMaterial, number>
  letterSurchargePct: Record<LetterMaterial, number>
  minWidth: number
  minHeight: number
  maxAutoWidth: number
  maxAutoHeight: number
}

export type LevhaAyah = { id: string; name: { bs: string; en: string }; arabic: string; translation: { bs: string; en: string } | null; image: { id: string; url: string; width: number; height: number } | null }
export type LevhaCatalogue = { pricing: LevhaPricing; ayahs: LevhaAyah[] }

/** Letters may not be the same colour as the background (e.g. black on black). */
export function sameColour(background: Pick<Background, "colour">, letters: Pick<Letters, "colour">) {
  return background.colour === letters.colour
}

/** Price in whole KM, or null when the size is priced on request (or below the minimum). */
export function levhaPrice(pricing: LevhaPricing, choice: { size: { width: number; height: number }; background: Pick<Background, "material">; letters: Pick<Letters, "material"> }) {
  const { width, height } = choice.size
  if (width < pricing.minWidth || height < pricing.minHeight) return null
  const standard = pricing.sizes.find(size => size.width === width && size.height === height)
  let base: number
  if (standard) base = standard.price
  else {
    const longest = Math.max(pricing.maxAutoWidth, pricing.maxAutoHeight)
    const shortest = Math.min(pricing.maxAutoWidth, pricing.maxAutoHeight)
    if (Math.max(width, height) > longest || Math.min(width, height) > shortest) return null
    base = (width * height / 10_000) * pricing.pricePerSqm
  }
  const surcharge = pricing.backgroundSurchargePct[choice.background.material] + pricing.letterSurchargePct[choice.letters.material]
  return Math.max(0, Math.round(base * (1 + surcharge / 100)))
}

/** Frame profile width in cm, used to draw the frame at real scale. */
export const frameWidthCm = 2.5

/**
 * How each finish is painted in the preview (CSS background). Wood, plywood and MDF use
 * small tiling textures; mirrors use gradients with a highlight so they read as reflective.
 */
export function finish(kind: "frame" | "background" | "letters", colour: FrameColour | LevhaColour, material?: string): React.CSSProperties {
  const texture = (file: string, size = "220px") => ({ backgroundImage: `url(/images/levha/${file}.webp)`, backgroundSize: size })
  if (colour === "wood") return kind === "frame" ? texture("wood-frame", "160px") : texture("plywood-wood", kind === "letters" ? "120px" : "260px")
  if (colour === "raw") return texture("mdf", "160px")
  // Gold mirror reads pale and bright, as on the real pieces.
  if (colour === "gold") return { backgroundImage: "linear-gradient(115deg, #a8822e 0%, #f0d58e 18%, #fff7da 30%, #e3c470 44%, #b9913a 58%, #f3dc98 74%, #caa24c 88%, #94701f 100%)" }
  if (colour === "gray") return { backgroundImage: "linear-gradient(120deg, #4b4f55 0%, #b9bec5 18%, #f4f6f8 30%, #9ca2aa 44%, #5d6269 58%, #d3d7dc 74%, #868c94 88%, #44484e 100%)" }
  if (colour === "black") {
    if (material === "plexiglass") return { backgroundImage: "linear-gradient(125deg, #050506 0%, #1d1e22 35%, #3a3b40 42%, #121316 50%, #08080a 100%)" }
    // Black-stained wood frame and matte black plywood (texture from a real panel).
    return kind === "frame" ? texture("wood-black", "160px") : texture("plywood-black", "260px")
  }
  // white
  return { backgroundImage: kind === "frame" ? "linear-gradient(135deg, #fbfaf7, #e4e1da)" : "linear-gradient(135deg, #f7f5f0, #e9e5dd)" }
}

export type LevhaConfiguration = {
  frame: FrameColour
  size: { width: number; height: number }
  background: Background
  letters: Letters
  ayahId: string | null
  customAyah: { text: string; part?: string } | null
  subtitle: { kind: "none" } | { kind: "translation" } | { kind: "custom"; text: string }
}

export async function submitLevhaRequest(input: { locale: Locale; configuration: LevhaConfiguration; customer: { fullName: string; email: string; phone?: string }; notes?: string }) {
  const response = await fetch(`${browserApiUrl()}/public/levha-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const body = await response.json().catch(() => null) as { number?: string; price?: number | null; message?: string } | null
  if (!response.ok || !body?.number) throw new OrderError(body?.message ?? "Levha request failed")
  return { number: body.number, price: body.price ?? null }
}
