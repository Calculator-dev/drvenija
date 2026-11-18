"use client"

import Image from "next/image"
import { useId, useState } from "react"
import { useTranslations } from "next-intl"
import { activeVariants, isSvg, type Locale } from "@/lib/products"
import { WallPaintCanvas } from "@/components/wall-paint-canvas"
import { normaliseHex, parseDimensionsCm, productPlacement, wallColours, type ShowroomConfig, type ShowroomProduct, type WallColour } from "@/lib/showroom"
import { cn } from "@/lib/utils"

/**
 * A product's cutout hanging on the showroom wall at real size (from the selected size's
 * dimensions), with wall colours to try.
 */
export function ShowroomViewer({ config, product, locale, variantId, onVariantChange, wall: controlledWall, onWallChange, priority = false, className }: {
  config: ShowroomConfig
  product: ShowroomProduct
  locale: Locale
  /** Controlled size; when left out the viewer keeps its own. */
  variantId?: string
  onVariantChange?: (variantId: string) => void
  /** Controlled wall colour, so it survives switching products; when left out the viewer keeps its own. */
  wall?: WallColour
  onWallChange?: (wall: WallColour) => void
  priority?: boolean
  className?: string
}) {
  const t = useTranslations("showroom")
  const [ownWall, setOwnWall] = useState<WallColour>(null)
  const wall = controlledWall !== undefined ? controlledWall : ownWall
  const setWall = (colour: WallColour) => (onWallChange ? onWallChange(colour) : setOwnWall(colour))
  const pickerId = useId()
  const isCustom = wall !== null && !wallColours.some(item => item.hex === wall)
  // Typed hex value; applied as soon as it is a valid colour.
  const [hexDraft, setHexDraft] = useState("")
  const variants = activeVariants(product)
  const [ownVariantId, setOwnVariantId] = useState(variants[0]!.id)
  const selectedId = variantId ?? ownVariantId
  const variant = variants.find(item => item.id === selectedId) ?? variants[0]!
  const chooseVariant = (id: string) => (onVariantChange ? onVariantChange(id) : setOwnVariantId(id))

  const art = product.cutoutImage
  const aspect = art.width > 0 && art.height > 0 ? art.width / art.height : 1
  const placement = productPlacement(config, aspect, parseDimensionsCm(variant.dimensions))

  return (
    <div className={className}>
      <div
        className="relative isolate overflow-hidden rounded-sm border border-accent/25 bg-muted"
        style={{ aspectRatio: `${config.image.width} / ${config.image.height}` }}
      >
        <Image
          src={config.image.url}
          alt={t("roomAlt")}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
        <WallPaintCanvas config={config} colour={wall} />
        <div
          className="absolute transition-all duration-500"
          style={{
            left: `${placement.left}%`,
            top: `${placement.top}%`,
            width: `${placement.width}%`,
            height: `${placement.height}%`,
            filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.38))",
          }}
        >
          <Image
            unoptimized={isSvg(art.url)}
            src={art.url}
            alt={art.alt[locale]}
            fill
            sizes="(min-width: 1024px) 30vw, 50vw"
            className="object-contain"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <fieldset>
          <legend className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("wallColour")}</legend>
          <div className="flex flex-wrap items-center gap-2">
            <Swatch label={t("walls.original")} active={wall === null} onClick={() => { setWall(null); setHexDraft("") }} style={{ backgroundImage: "linear-gradient(135deg, #cdbfae 50%, #b9a99a 50%)" }} />
            {wallColours.map(item => (
              <Swatch key={item.key} label={t(`walls.${item.key}`)} active={wall === item.hex} onClick={() => { setWall(item.hex); setHexDraft(item.hex) }} style={{ backgroundColor: item.hex }} />
            ))}
            {/* Any colour: the native picker sits invisibly on top of a rainbow swatch. */}
            <label
              htmlFor={pickerId}
              title={t("customColour")}
              className={cn(
                "relative h-9 w-9 cursor-pointer rounded-full border-2 transition-transform hover:scale-110 focus-within:ring-2 focus-within:ring-accent",
                isCustom ? "border-accent ring-2 ring-accent/40" : "border-ivory/30",
              )}
              style={isCustom ? { backgroundColor: wall } : { backgroundImage: "conic-gradient(#e53935, #fdd835, #43a047, #1e88e5, #8e24aa, #e53935)" }}
            >
              <span className="sr-only">{t("customColour")}</span>
              <input
                id={pickerId}
                type="color"
                value={wall ?? "#e8d9c0"}
                onChange={event => { setWall(event.target.value); setHexDraft(event.target.value) }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="sr-only">{t("hexLabel")}</span>
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                maxLength={7}
                placeholder="#e8d9c0"
                value={hexDraft}
                onChange={event => {
                  setHexDraft(event.target.value)
                  const hex = normaliseHex(event.target.value)
                  if (hex && event.target.value.replace("#", "").length === 6) setWall(hex)
                }}
                aria-label={t("hexLabel")}
                className="h-9 w-24 rounded-sm border border-input bg-transparent px-2 font-mono text-xs uppercase text-foreground outline-none focus:border-accent"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("customHint")}</p>
        </fieldset>
        {variants.length > 1 && (
          <fieldset>
            <legend className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("size")}</legend>
            <div className="flex flex-wrap gap-2">
              {variants.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseVariant(item.id)}
                  aria-pressed={item.id === variant.id}
                  className={cn("border px-3 py-1.5 text-sm transition-colors", item.id === variant.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground")}
                >
                  {item.dimensions}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {placement.realSize ? t("realSize", { size: variant.dimensions }) : t("approximate")}
      </p>
    </div>
  )
}


function Swatch({ label, active, onClick, style }: { label: string; active: boolean; onClick: () => void; style: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      aria-label={label}
      className={cn("h-9 w-9 rounded-full border-2 transition-transform hover:scale-110", active ? "border-accent ring-2 ring-accent/40" : "border-ivory/30")}
      style={style}
    />
  )
}
