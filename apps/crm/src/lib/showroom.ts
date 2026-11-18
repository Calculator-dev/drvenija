/**
 * Editing math for the showroom page. All coordinates are percentages (0–100) of the
 * showroom photo's width and height, the same as GET/PUT /admin/showroom.
 */

export type ArtArea = { x: number; y: number; width: number; height: number }
export type OutlinePoint = [number, number]
export type ShowroomImage = { id: string; url: string; width: number; height: number }

/** GET /admin/showroom; the endpoint returns null until the showroom is first saved. */
export type ShowroomSettings = {
  image: ShowroomImage | null
  artArea: ArtArea
  wallOutline: OutlinePoint[]
  areaWidthCm: number
  updatedAt: string
}

/** PUT /admin/showroom body. */
export type ShowroomInput = {
  imageId: string | null
  artArea: ArtArea
  wallOutline: OutlinePoint[]
  areaWidthCm: number
}

/** Editable state; the width in cm stays text so the field can be cleared while typing. */
export type ShowroomDraft = {
  image: ShowroomImage | null
  artArea: ArtArea
  wallOutline: OutlinePoint[]
  areaWidthCm: string
}

export type Corner = "nw" | "ne" | "sw" | "se"
type Rect = { left: number; top: number; width: number; height: number }

export const MIN_AREA_SIZE = 2
export const MIN_OUTLINE_POINTS = 3
export const MAX_OUTLINE_POINTS = 60
export const MIN_AREA_WIDTH_CM = 20
export const MAX_AREA_WIDTH_CM = 1000
export const SAMPLE_WALL_COLOUR = "#9fb59a"

export const defaultArtArea = (): ArtArea => ({ x: 30, y: 15, width: 40, height: 35 })
export const defaultWallOutline = (): OutlinePoint[] => [[0, 0], [100, 0], [100, 60], [0, 60]]
export const DEFAULT_AREA_WIDTH_CM = 120

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
/** Two decimals are far finer than a pixel, and keep the saved JSON readable. */
const round = (value: number) => Math.round(value * 100) / 100

export function showroomDraft(settings: ShowroomSettings | null | undefined): ShowroomDraft {
  if (!settings) return { image: null, artArea: defaultArtArea(), wallOutline: defaultWallOutline(), areaWidthCm: String(DEFAULT_AREA_WIDTH_CM) }
  return {
    image: settings.image,
    artArea: { ...settings.artArea },
    wallOutline: settings.wallOutline.map(([x, y]) => [x, y]),
    areaWidthCm: String(settings.areaWidthCm),
  }
}

/** A new photo has a different layout, so the area and outline start over. */
export function withNewPhoto(draft: ShowroomDraft, image: ShowroomImage): ShowroomDraft {
  return { ...draft, image, artArea: defaultArtArea(), wallOutline: defaultWallOutline() }
}

/** Without a photo the webshop uses its demo room; keep the marks, but never leave an unsavable outline. */
export function withoutPhoto(draft: ShowroomDraft): ShowroomDraft {
  return { ...draft, image: null, wallOutline: draft.wallOutline.length >= MIN_OUTLINE_POINTS ? draft.wallOutline : defaultWallOutline() }
}

/** Pointer position inside the photo's bounding box, as clamped percentages. */
export function pointerToPercent(clientX: number, clientY: number, rect: Rect): OutlinePoint {
  if (rect.width <= 0 || rect.height <= 0) return [0, 0]
  return [
    round(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)),
    round(clamp(((clientY - rect.top) / rect.height) * 100, 0, 100)),
  ]
}

/** A pointer movement in pixels, as percentages of the photo. */
export function deltaToPercent(dx: number, dy: number, rect: Pick<Rect, "width" | "height">): [number, number] {
  if (rect.width <= 0 || rect.height <= 0) return [0, 0]
  return [(dx / rect.width) * 100, (dy / rect.height) * 100]
}

/** Keeps the area at least 2 % in size and fully inside the photo. */
export function clampArea(area: ArtArea): ArtArea {
  // Round the size first, so the rounded position cannot push the area past the edge.
  const width = round(clamp(finite(area.width, MIN_AREA_SIZE), MIN_AREA_SIZE, 100))
  const height = round(clamp(finite(area.height, MIN_AREA_SIZE), MIN_AREA_SIZE, 100))
  return {
    x: clamp(round(finite(area.x, 0)), 0, round(100 - width)),
    y: clamp(round(finite(area.y, 0)), 0, round(100 - height)),
    width,
    height,
  }
}

/** Moves the area by a percentage offset without changing its size. */
export function moveArea(start: ArtArea, dx: number, dy: number): ArtArea {
  return clampArea({ ...start, x: start.x + dx, y: start.y + dy })
}

/** Moves one corner by a percentage offset; the opposite corner stays where it was. */
export function resizeArea(start: ArtArea, corner: Corner, dx: number, dy: number): ArtArea {
  let left = start.x
  let top = start.y
  let right = start.x + start.width
  let bottom = start.y + start.height
  if (corner === "nw" || corner === "sw") left = clamp(left + dx, 0, right - MIN_AREA_SIZE)
  else right = clamp(right + dx, left + MIN_AREA_SIZE, 100)
  if (corner === "nw" || corner === "ne") top = clamp(top + dy, 0, bottom - MIN_AREA_SIZE)
  else bottom = clamp(bottom + dy, top + MIN_AREA_SIZE, 100)
  return clampArea({ x: left, y: top, width: right - left, height: bottom - top })
}

/**
 * One numeric field of the area. Position fields keep the size and stop at the edge;
 * size fields keep the position and stop at the edge.
 */
export function setAreaField(area: ArtArea, field: keyof ArtArea, value: number): ArtArea {
  if (!Number.isFinite(value)) return area
  if (field === "x") return clampArea({ ...area, x: clamp(value, 0, 100 - area.width) })
  if (field === "y") return clampArea({ ...area, y: clamp(value, 0, 100 - area.height) })
  if (field === "width") return clampArea({ ...area, width: clamp(value, MIN_AREA_SIZE, 100 - area.x) })
  return clampArea({ ...area, height: clamp(value, MIN_AREA_SIZE, 100 - area.y) })
}

export function addOutlinePoint(outline: OutlinePoint[], point: OutlinePoint): OutlinePoint[] {
  if (outline.length >= MAX_OUTLINE_POINTS) return outline
  return [...outline, clampPoint(point)]
}

export function moveOutlinePoint(outline: OutlinePoint[], index: number, point: OutlinePoint): OutlinePoint[] {
  if (index < 0 || index >= outline.length) return outline
  return outline.map((current, i) => (i === index ? clampPoint(point) : current))
}

export function removeOutlinePoint(outline: OutlinePoint[], index: number): OutlinePoint[] {
  return outline.filter((_point, i) => i !== index)
}

export const undoOutlinePoint = (outline: OutlinePoint[]) => outline.slice(0, -1)

/** CSS clip-path for the wall outline. */
export function outlineClipPath(outline: OutlinePoint[]) {
  return `polygon(${outline.map(([x, y]) => `${x}% ${y}%`).join(", ")})`
}

/** SVG `points` for a 0–100 viewBox. */
export function outlineSvgPoints(outline: OutlinePoint[]) {
  return outline.map(([x, y]) => `${x},${y}`).join(" ")
}

/** Real height of the marked area, from its width in cm and the photo's proportions. */
export function areaHeightCm(area: ArtArea, widthCm: number, image: Pick<ShowroomImage, "width" | "height">) {
  if (!(widthCm > 0) || area.width <= 0 || image.width <= 0) return null
  return Math.round((widthCm * area.height * image.height) / (area.width * image.width))
}

/** Validates the draft and builds the PUT /admin/showroom body, or lists what to fix. */
export function showroomPayload(draft: ShowroomDraft): { body: ShowroomInput; errors?: undefined } | { body?: undefined; errors: string[] } {
  const errors: string[] = []
  const { x, y, width, height } = draft.artArea
  if (![x, y, width, height].every(Number.isFinite) || x < 0 || y < 0 || width < MIN_AREA_SIZE || height < MIN_AREA_SIZE || x + width > 100.001 || y + height > 100.001)
    errors.push("Prostor za sliku mora biti unutar fotografije i velik najmanje 2 % širine i visine.")
  if (draft.wallOutline.length < MIN_OUTLINE_POINTS) errors.push("Obris zida mora imati najmanje 3 tačke.")
  else if (draft.wallOutline.length > MAX_OUTLINE_POINTS) errors.push("Obris zida može imati najviše 60 tačaka.")
  if (draft.wallOutline.some(point => point.some(value => !Number.isFinite(value) || value < 0 || value > 100)))
    errors.push("Sve tačke obrisa zida moraju biti unutar fotografije.")
  const widthText = draft.areaWidthCm.trim()
  const areaWidthCm = Number(widthText)
  if (widthText === "" || !Number.isInteger(areaWidthCm) || areaWidthCm < MIN_AREA_WIDTH_CM || areaWidthCm > MAX_AREA_WIDTH_CM)
    errors.push("Širina označenog prostora mora biti cijeli broj centimetara, od 20 do 1000.")
  if (errors.length) return { errors }
  return {
    body: {
      imageId: draft.image?.id ?? null,
      artArea: { x, y, width, height },
      wallOutline: draft.wallOutline.map(([px, py]) => [round(px), round(py)]),
      areaWidthCm,
    },
  }
}

/** Bosnian message for a failed save; the API's own messages are in English. */
export function showroomSaveError(error: { message: string; status?: number }) {
  if (error.status === 409) return "Ova fotografija pripada proizvodu. Učitajte posebnu fotografiju za showroom."
  if (error.status === 400 && /no longer exists/i.test(error.message)) return "Fotografija showrooma više ne postoji. Učitajte je ponovo."
  if (error.status === 400) return `Podaci nisu ispravni (${error.message}). Provjerite polja i pokušajte ponovo.`
  return error.message
}

function clampPoint([x, y]: OutlinePoint): OutlinePoint {
  return [round(clamp(finite(x, 0), 0, 100)), round(clamp(finite(y, 0), 0, 100))]
}

function finite(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}
