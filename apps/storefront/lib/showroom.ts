/** Showroom maths shared by the showroom page and the product page's "On your wall" section. */

import type { LocalizedProduct } from "./products"

/** Products that can hang on the showroom wall: those with a cutout ("Slika bez pozadine"). */
export type ShowroomProduct = LocalizedProduct & { cutoutImage: NonNullable<LocalizedProduct["cutoutImage"]> }

export function hasCutout(product: LocalizedProduct): product is ShowroomProduct {
  return Boolean(product.cutoutImage)
}

export type ShowroomArea = { x: number; y: number; width: number; height: number }
export type ShowroomConfig = {
  image: { url: string; width: number; height: number }
  /** Where artwork hangs, in percent of the photo. */
  artArea: ShowroomArea
  /** The visible wall, in percent of the photo; only this part is repainted. */
  wallOutline: Array<[number, number]>
  /** Real width of the artwork area in cm, for drawing products at real size. */
  areaWidthCm: number
  /** Optional per-pixel wall mask (PNG, opaque where the wall is); more precise than the outline. */
  wallMaskUrl?: string
}

/** Built-in living room, used until a showroom photo is set in the CRM. */
export const defaultShowroom: ShowroomConfig = {
  image: { url: "/images/showroom/living-room.webp", width: 1448, height: 1086 },
  artArea: { x: 30.8, y: 14.9, width: 43.6, height: 38.3 },
  wallOutline: [[17.6, 5.3], [41.4, 0], [100, 0], [100, 31.6], [87, 31.6], [87, 43.3], [92.5, 43.3], [92.5, 49.7], [83.2, 51.1], [83.2, 61.5], [17.6, 61.5]],
  areaWidthCm: 120,
  wallMaskUrl: "/images/showroom/living-room-wall.png",
}

/** Suggested wall colours; customers can also pick any colour. */
export const wallColours = [
  { key: "white", hex: "#f4f2ee" },
  { key: "cream", hex: "#e8d9c0" },
  { key: "sage", hex: "#9fae92" },
  { key: "blue", hex: "#8fa3b5" },
  { key: "terracotta", hex: "#c0785a" },
  { key: "burgundy", hex: "#6e2230" },
  { key: "charcoal", hex: "#45464a" },
] as const

/** A wall colour as #rrggbb, or null for the photo's own colour. */
export type WallColour = string | null

export function isHexColour(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

/** "#abc" or "abcdef" → "#aabbcc"; null when it is not a colour. */
export function normaliseHex(value: string): string | null {
  let hex = value.trim().replace(/^#/, "")
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split("").map(c => c + c).join("")
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null
}

// sRGB ↔ linear light. Decoding uses a 256-entry table and encoding a 4096-entry one,
// so repainting a photo of about a million pixels stays fast.
const toLinear = new Float32Array(256).map((_, i) => {
  const c = i / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
})
const encodeSteps = 4096
const toSrgb = new Uint8ClampedArray(encodeSteps + 1).map((_, i) => {
  const c = i / encodeSteps
  return Math.round((c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055) * 255)
})

/**
 * The wall's reference brightness per channel (in linear light): the 75th percentile of
 * wall pixels. Pixels at this brightness get exactly the chosen colour; darker ones keep
 * their shadow and brighter ones (lamp light) their glow.
 */
export function wallReference(photo: Uint8ClampedArray, mask: Uint8ClampedArray) {
  const samples: number[][] = [[], [], []]
  const step = Math.max(1, Math.floor(photo.length / 4 / 60000))
  for (let i = 0; i < photo.length / 4; i += step) {
    if (mask[i * 4 + 3] < 128) continue
    for (let c = 0; c < 3; c++) samples[c].push(toLinear[photo[i * 4 + c]])
  }
  return samples.map(values => {
    if (!values.length) return 0.4
    values.sort((a, b) => a - b)
    return Math.max(values[Math.floor(values.length * 0.75)], 0.02)
  }) as [number, number, number]
}

/**
 * Repaints the wall: each wall pixel becomes the chosen colour scaled by how light that
 * pixel is compared with the wall's reference, per channel, so shadows, lamp light and
 * texture stay. Writes into `out` (RGBA, transparent outside the wall).
 */
export function repaintWall(photo: Uint8ClampedArray, mask: Uint8ClampedArray, reference: [number, number, number], hex: string, out: Uint8ClampedArray) {
  const target = [1, 3, 5].map(i => toLinear[parseInt(hex.slice(i, i + 2), 16)])
  const scale = target.map((value, c) => (value / reference[c]) * encodeSteps)
  for (let i = 0; i < photo.length; i += 4) {
    const alpha = mask[i + 3]
    if (alpha === 0) { out[i + 3] = 0; continue }
    for (let c = 0; c < 3; c++) {
      const level = toLinear[photo[i + c]] * scale[c]
      out[i + c] = toSrgb[level >= encodeSteps ? encodeSteps : level | 0]
    }
    out[i + 3] = alpha
  }
  return out
}

/** "60 × 40 cm", "60x40cm", "Ø 50 cm" or "120 cm" → width and (if given) height in cm. */
export function parseDimensionsCm(text: string | undefined): { width: number; height?: number } | null {
  if (!text) return null
  const numbers = [...text.replace(/,/g, ".").matchAll(/(\d+(?:\.\d+)?)/g)].map(match => Number(match[1])).filter(value => value > 0)
  if (!numbers.length) return null
  const inMm = /\bmm\b/i.test(text) && !/\bcm\b/i.test(text)
  const scale = inMm ? 0.1 : 1
  const [width, height] = numbers
  return { width: width * scale, height: height !== undefined ? height * scale : undefined }
}

/**
 * Where to draw a product on the photo, in percent of the photo, centred on the artwork
 * area. With known dimensions it is drawn at real size; otherwise it fills the area.
 */
export function productPlacement(config: ShowroomConfig, imageAspect: number, dimensions: ReturnType<typeof parseDimensionsCm>) {
  const { artArea, areaWidthCm, image } = config
  const photoAspect = image.width / image.height
  const centreX = artArea.x + artArea.width / 2
  const centreY = artArea.y + artArea.height / 2
  let width: number
  let height: number
  if (dimensions) {
    const percentPerCmX = artArea.width / areaWidthCm
    const heightCm = dimensions.height ?? dimensions.width / imageAspect
    width = dimensions.width * percentPerCmX
    height = heightCm * percentPerCmX * photoAspect
  } else {
    // Fit inside the area, keeping the product's proportions.
    const areaAspect = (artArea.width * photoAspect) / artArea.height
    width = imageAspect >= areaAspect ? artArea.width : artArea.height * imageAspect / photoAspect
    height = width * photoAspect / imageAspect
  }
  return { left: centreX - width / 2, top: centreY - height / 2, width, height, realSize: Boolean(dimensions) }
}

export function outlinePoints(outline: ShowroomConfig["wallOutline"]) {
  return outline.map(([x, y]) => `${x},${y}`).join(" ")
}
