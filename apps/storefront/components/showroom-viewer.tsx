"use client"

import Image from "next/image"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { activeVariants, isSvg, type Locale } from "@/lib/products"
import { outlinePoints, parseDimensionsCm, productPlacement, wallColours, wallPaint, type ShowroomConfig, type ShowroomProduct, type WallColourKey } from "@/lib/showroom"
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
  wall?: WallColourKey
  onWallChange?: (wall: WallColourKey) => void
  priority?: boolean
  className?: string
}) {
  const t = useTranslations("showroom")
  const [ownWall, setOwnWall] = useState<WallColourKey>("original")
  const wall = controlledWall ?? ownWall
  const setWall = (key: WallColourKey) => (onWallChange ? onWallChange(key) : setOwnWall(key))
  const variants = activeVariants(product)
  const [ownVariantId, setOwnVariantId] = useState(variants[0]!.id)
  const selectedId = variantId ?? ownVariantId
  const variant = variants.find(item => item.id === selectedId) ?? variants[0]!
  const chooseVariant = (id: string) => (onVariantChange ? onVariantChange(id) : setOwnVariantId(id))

  const art = product.cutoutImage
  const aspect = art.width > 0 && art.height > 0 ? art.width / art.height : 1
  const placement = productPlacement(config, aspect, parseDimensionsCm(variant.dimensions))
  const colour = wallColours.find(item => item.key === wall)
  const paint = colour?.hex ? wallPaint(colour.hex) : null
  const points = outlinePoints(config.wallOutline)

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
        {paint && (
          config.wallMaskUrl ? (
            <>
              <div aria-hidden className="absolute inset-0" style={{ backgroundColor: paint.hue, mixBlendMode: "color", ...maskStyle(config.wallMaskUrl) }} />
              <div aria-hidden className="absolute inset-0" style={{ backgroundColor: paint.grey, mixBlendMode: paint.mode, ...maskStyle(config.wallMaskUrl) }} />
            </>
          ) : (
            <>
              <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" style={{ mixBlendMode: "color" }}>
                <polygon points={points} fill={paint.hue} />
              </svg>
              <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" style={{ mixBlendMode: paint.mode }}>
                <polygon points={points} fill={paint.grey} />
              </svg>
            </>
          )
        )}
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
          <div className="flex flex-wrap gap-2">
            {wallColours.map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setWall(item.key)}
                aria-pressed={wall === item.key}
                title={t(`walls.${item.key}`)}
                aria-label={t(`walls.${item.key}`)}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition-transform hover:scale-110",
                  wall === item.key ? "border-accent ring-2 ring-accent/40" : "border-ivory/30",
                )}
                style={item.hex ? { backgroundColor: item.hex } : { backgroundImage: "linear-gradient(135deg, #cdbfae 50%, #b9a99a 50%)" }}
              />
            ))}
          </div>
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

function maskStyle(url: string): React.CSSProperties {
  const image = `url("${url}")`
  return { maskImage: image, WebkitMaskImage: image, maskSize: "100% 100%", WebkitMaskSize: "100% 100%", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat" }
}
