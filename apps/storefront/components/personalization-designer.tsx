"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export const personalizationFonts = ["script", "classic", "modern"] as const
export const personalizationFinishes = ["gold", "black", "wood"] as const
export type PersonalizationFont = (typeof personalizationFonts)[number]
export type PersonalizationFinish = (typeof personalizationFinishes)[number]
export type PersonalizationDesign = { text: string; font: PersonalizationFont; finish: PersonalizationFinish }

export const personalizationMaxLength = 160

const fontClass: Record<PersonalizationFont, string> = {
  script: "font-script",
  classic: "font-serif",
  modern: "font-sans font-semibold tracking-wide",
}

// Gold and wood use gradients clipped to the letters so they read as material, not flat colour.
const finishClass: Record<PersonalizationFinish, string> = {
  gold: "bg-linear-to-b from-[#f6d77a] via-[#d9a02a] to-[#9a6a14] bg-clip-text text-transparent drop-shadow-[0_2px_1px_rgba(0,0,0,0.25)]",
  black: "text-[#141210] drop-shadow-[0_2px_1px_rgba(0,0,0,0.2)]",
  wood: "bg-linear-to-b from-[#d9b48a] via-[#a8784c] to-[#7a5130] bg-clip-text text-transparent drop-shadow-[0_2px_1px_rgba(0,0,0,0.2)]",
}

const swatchClass: Record<PersonalizationFinish, string> = {
  gold: "bg-linear-to-br from-[#f6d77a] to-[#9a6a14]",
  black: "bg-[#141210]",
  wood: "bg-linear-to-br from-[#d9b48a] to-[#7a5130]",
}

/** The text sent with the order: what the customer typed plus the chosen font and finish. */
export function personalizationNote(design: PersonalizationDesign, labels: { font: string; finish: string }) {
  const text = design.text.trim()
  return text ? `${text}\n— ${labels.font} · ${labels.finish}` : ""
}

/**
 * Text input with a live preview: the customer types a name or quote, picks a lettering style
 * and finish, and sees it drawn on a wall before ordering. The final draft is still approved
 * by email before cutting.
 */
export function PersonalizationDesigner({ design, onChange }: { design: PersonalizationDesign; onChange: (design: PersonalizationDesign) => void }) {
  const t = useTranslations("personalize")
  const text = design.text.trim()
  const lines = text.split("\n").slice(0, 4)
  const longest = Math.max(...lines.map(line => line.length), 1)
  // Shrink long lines so the preview stays on one board.
  const size = longest > 28 ? "text-2xl" : longest > 18 ? "text-3xl" : longest > 10 ? "text-4xl" : "text-5xl"

  return (
    <div className="mt-7 border border-border bg-card p-4 sm:p-5">
      <label htmlFor="personalization" className="block text-sm font-semibold">{t("label")}</label>
      <textarea
        id="personalization"
        rows={2}
        maxLength={personalizationMaxLength}
        value={design.text}
        onChange={event => onChange({ ...design, text: event.target.value })}
        placeholder={t("placeholder")}
        className="mt-3 w-full resize-none border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
      />
      <p className="mt-1 text-right text-[11px] text-muted-foreground">{design.text.length}/{personalizationMaxLength}</p>

      <fieldset className="mt-3">
        <legend className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("fontLabel")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {personalizationFonts.map(font => (
            <button
              key={font}
              type="button"
              aria-pressed={design.font === font}
              onClick={() => onChange({ ...design, font })}
              className={cn("min-h-12 border px-2 text-lg transition-colors", fontClass[font], design.font === font ? "border-foreground bg-secondary" : "border-border hover:border-foreground")}
            >
              {t(`fonts.${font}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("finishLabel")}</legend>
        <div className="flex flex-wrap gap-2">
          {personalizationFinishes.map(finish => (
            <button
              key={finish}
              type="button"
              aria-pressed={design.finish === finish}
              onClick={() => onChange({ ...design, finish })}
              className={cn("inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm transition-colors", design.finish === finish ? "border-foreground bg-secondary" : "border-border hover:border-foreground")}
            >
              <span aria-hidden className={cn("h-4 w-4 rounded-full border border-black/10", swatchClass[finish])} />
              {t(`finishes.${finish}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5" aria-live="polite">
        <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("previewLabel")}</p>
        <div className="relative flex aspect-16/9 items-center justify-center overflow-hidden rounded-sm bg-[#ece4d6] px-6 shadow-inner">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(255,255,255,0.55),transparent_60%)]" />
          {text ? (
            <p className={cn("relative text-center leading-tight wrap-break-word", fontClass[design.font], finishClass[design.finish], size)}>
              {lines.map((line, index) => <span key={index} className="block">{line || " "}</span>)}
            </p>
          ) : (
            <p className="relative text-center text-sm text-[#6e5450]">{t("previewEmpty")}</p>
          )}
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("previewNote")}</p>
      </div>
    </div>
  )
}
