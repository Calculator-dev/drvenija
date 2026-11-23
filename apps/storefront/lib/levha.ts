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
  backgroundSurchargePct: Record<BackgroundMaterial, number>
  letterSurchargePct: Record<LetterMaterial, number>
  minWidth: number
  minHeight: number
}

export type LevhaAyah = { id: string; name: { bs: string; en: string }; arabic: string; translation: { bs: string; en: string } | null; image: { id: string; url: string; width: number; height: number } | null }
export type LevhaCatalogue = { pricing: LevhaPricing; ayahs: LevhaAyah[] }

/** Letters may not be the same colour as the background (e.g. black on black). */
export function sameColour(background: Pick<Background, "colour">, letters: Pick<Letters, "colour">) {
  return background.colour === letters.colour
}

/**
 * Price in whole KM, or null when the shop first confirms the levha can be made: any size
 * other than a standard one, or the customer's own text. Mirrors the API.
 */
export function levhaPrice(pricing: LevhaPricing, choice: { size: { width: number; height: number }; background: Pick<Background, "material">; letters: Pick<Letters, "material">; ownText: boolean }) {
  if (choice.ownText) return null
  const standard = pricing.sizes.find(size => size.width === choice.size.width && size.height === choice.size.height)
  if (!standard) return null
  const surcharge = pricing.backgroundSurchargePct[choice.background.material] + pricing.letterSurchargePct[choice.letters.material]
  return Math.max(0, Math.round(standard.price * (1 + surcharge / 100)))
}

/** Frame profile width in cm, used to draw the frame at real scale. */
export const frameWidthCm = 2

/**
 * How each finish is painted in the preview (CSS background). Wood, plywood and MDF use
 * small tiling textures; mirrors use gradients with a highlight so they read as reflective.
 */
export function finish(kind: "frame" | "background" | "letters", colour: FrameColour | LevhaColour, material?: string): React.CSSProperties {
  const texture = (file: string, size = "220px") => ({ backgroundImage: `url(/images/levha/${file}.webp)`, backgroundSize: size })
  if (colour === "wood") return kind === "frame" ? frameFinish("wood", "h") : kind === "letters" ? texture("plywood-wood", "240px") : { ...texture("plywood-wood", "cover"), backgroundPosition: "center" }
  if (colour === "raw") return texture("mdf", "160px")
  // Gold mirror reads pale and bright, as on the real pieces.
  if (colour === "gold") return { backgroundImage: "linear-gradient(115deg, #a8822e 0%, #f0d58e 18%, #fff7da 30%, #e3c470 44%, #b9913a 58%, #f3dc98 74%, #caa24c 88%, #94701f 100%)" }
  if (colour === "gray") return { backgroundImage: "linear-gradient(120deg, #4b4f55 0%, #b9bec5 18%, #f4f6f8 30%, #9ca2aa 44%, #5d6269 58%, #d3d7dc 74%, #868c94 88%, #44484e 100%)" }
  if (colour === "black") {
    if (material === "plexiglass") return { backgroundImage: "linear-gradient(125deg, #050506 0%, #1d1e22 35%, #3a3b40 42%, #121316 50%, #08080a 100%)" }
    // Black-stained wood frame and matte black plywood (texture from a real panel).
    return kind === "frame" ? frameFinish("black", "h") : texture("plywood-black", "260px")
  }
  // white
  return kind === "frame" ? frameFinish("white", "h") : { backgroundImage: "linear-gradient(135deg, #f7f5f0, #e9e5dd)" }
}

/**
 * One bar of the frame. The grain runs along the bar, so the top and bottom bars use a
 * horizontal texture and the sides a vertical one (both taken from photos of real frames).
 */
export function frameFinish(colour: FrameColour, direction: "h" | "v"): React.CSSProperties {
  // The white frame is the wooden frame sprayed white, so its grain shows faintly.
  const file = colour === "wood" ? "wood-frame" : colour === "white" ? "wood-white" : "wood-black"
  return { backgroundImage: `url(/images/levha/${file}-${direction}.webp)`, backgroundSize: direction === "h" ? "auto 100%" : "100% auto" }
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

export const contactMethods = ["email", "whatsapp", "viber"] as const
export type ContactMethod = (typeof contactMethods)[number]

export async function submitLevhaRequest(input: { locale: Locale; configuration: LevhaConfiguration; customer: { fullName: string; email: string; phone?: string; contact: ContactMethod }; notes?: string }) {
  const response = await fetch(`${browserApiUrl()}/public/levha-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const body = await response.json().catch(() => null) as { number?: string; price?: number | null; message?: string } | null
  if (!response.ok || !body?.number) throw new OrderError(body?.message ?? "Levha request failed")
  return { number: body.number, price: body.price ?? null }
}
