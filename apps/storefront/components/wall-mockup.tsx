"use client"

import Image from "next/image"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { isSvg, type Locale, type MediaAsset } from "@/lib/products"
import { cn } from "@/lib/utils"

const walls = [
  { key: "linen", wall: "#ece4d6", floor: "#c9b393" },
  { key: "sage", wall: "#c9d1bf", floor: "#b59c7a" },
  { key: "clay", wall: "#d9b7a0", floor: "#a8896a" },
  { key: "charcoal", wall: "#3f3d3a", floor: "#6b5a47" },
] as const

/**
 * A drawn living-room scene that shows the product image hanging above a sofa,
 * with a few wall colours to try. Purely illustrative; it uses the product's own photo.
 */
export function WallMockup({ image, locale, className }: { image: MediaAsset; locale: Locale; className?: string }) {
  const t = useTranslations("mockup")
  const [wallKey, setWallKey] = useState<(typeof walls)[number]["key"]>("linen")
  const wall = walls.find(item => item.key === wallKey) ?? walls[0]
  const dark = wall.key === "charcoal"

  return (
    <div className={className}>
      <div className="relative aspect-4/3 overflow-hidden transition-colors duration-500" style={{ backgroundColor: wall.wall }}>
        {/* soft light from the upper left */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(255,255,255,0.35),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[16%] transition-colors duration-500" style={{ backgroundColor: wall.floor }} />
        <div className="absolute inset-x-0 bottom-[16%] h-[1.5%] bg-black/10" />

        <div className="absolute left-1/2 top-[11%] w-[34%] -translate-x-1/2">
          <div className={cn("relative aspect-square overflow-hidden shadow-[0_18px_30px_-12px_rgba(0,0,0,0.45)]", dark ? "bg-white/5" : "bg-white/40")}>
            <Image unoptimized={isSvg(image.url)} src={image.url} alt={image.alt[locale]} fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-contain" />
          </div>
        </div>

        <svg viewBox="0 0 400 120" className="absolute bottom-[12%] left-1/2 w-[62%] -translate-x-1/2" aria-hidden>
          <rect x="18" y="20" width="364" height="62" rx="16" fill={dark ? "#a49786" : "#8a7a66"} />
          <rect x="0" y="48" width="44" height="52" rx="14" fill={dark ? "#958774" : "#7a6b58"} />
          <rect x="356" y="48" width="44" height="52" rx="14" fill={dark ? "#958774" : "#7a6b58"} />
          <rect x="38" y="62" width="324" height="34" rx="10" fill={dark ? "#b3a694" : "#988873"} />
          <rect x="60" y="30" width="58" height="38" rx="9" fill={dark ? "#d8cbb6" : "#d9c9ad"} />
          <rect x="282" y="30" width="58" height="38" rx="9" fill={dark ? "#c6b59b" : "#c4ae8b"} />
          <rect x="40" y="96" width="8" height="20" rx="2" fill="#3b2f25" />
          <rect x="352" y="96" width="8" height="20" rx="2" fill="#3b2f25" />
        </svg>

        <svg viewBox="0 0 60 160" className="absolute bottom-[14%] right-[5%] w-[9%]" aria-hidden>
          <path d="M30 90 C10 60 8 30 28 4 C34 30 50 50 30 90Z" fill="#5f7a52" />
          <path d="M30 92 C48 70 58 44 52 20 C40 40 26 60 30 92Z" fill="#6f8c60" />
          <path d="M18 100 h24 l-4 58 h-16Z" fill="#c9b49a" />
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("wallColour")}</p>
        {walls.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => setWallKey(item.key)}
            aria-pressed={item.key === wall.key}
            aria-label={t(`walls.${item.key}`)}
            title={t(`walls.${item.key}`)}
            className={cn("h-8 w-8 rounded-full border-2 transition-transform hover:scale-110", item.key === wall.key ? "border-foreground" : "border-border")}
            style={{ backgroundColor: item.wall }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("note")}</p>
    </div>
  )
}
