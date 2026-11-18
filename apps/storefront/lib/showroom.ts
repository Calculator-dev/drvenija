/** Showroom maths shared by the showroom page and the product page's "On your wall" section. */

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

/** Typical relative luminance of a painted wall in a room photo (the built-in room measures 0.42). */
const wallLuminance = 0.42

export const wallColours = [
  { key: "original", hex: null },
  { key: "white", hex: "#f2efe9" },
  { key: "sage", hex: "#9fae92" },
  { key: "blue", hex: "#8fa3b5" },
  { key: "terracotta", hex: "#c0785a" },
  { key: "burgundy", hex: "#6e2230" },
  { key: "charcoal", hex: "#45464a" },
] as const
export type WallColourKey = (typeof wallColours)[number]["key"]

function relativeLuminance(hex: string) {
  const channel = (index: number) => {
    const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}

/**
 * How to repaint the wall while keeping the photo's light and shadow: first give it the
 * colour's hue and saturation ("color" blend), then darken ("multiply") or lighten
 * ("screen") with a grey so the wall ends up about as light as the chosen paint.
 */
export function wallPaint(hex: string) {
  const target = relativeLuminance(hex)
  const toHex = (value: number) => {
    const level = Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0")
    return `#${level}${level}${level}`
  }
  // Grey levels are in sRGB; convert the linear ratio back with the sRGB curve.
  const encode = (linear: number) => linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055
  if (target <= wallLuminance) return { hue: hex, mode: "multiply" as const, grey: toHex(encode(target / wallLuminance)) }
  return { hue: hex, mode: "screen" as const, grey: toHex(encode((target - wallLuminance) / (1 - wallLuminance))) }
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
