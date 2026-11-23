"use client"

import { useId, useState } from "react"
import { useTranslations } from "next-intl"
import { normaliseHex, wallColours, type WallColour } from "@/lib/showroom"
import { cn } from "@/lib/utils"

/** Suggested wall colours, a picker for any colour and a field for a colour code. */
export function WallColourPicker({ value: wall, onChange: setWall }: { value: WallColour; onChange: (colour: WallColour) => void }) {
  const t = useTranslations("showroom")
  const pickerId = useId()
  const isCustom = wall !== null && !wallColours.some(item => item.hex === wall)
  // Typed hex value; applied as soon as it is a valid colour.
  const [hexDraft, setHexDraft] = useState("")

  return (
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
