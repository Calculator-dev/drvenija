"use client"

import Link from "next/link"
import { Check, Lock } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { LevhaPreview, type PreviewText } from "@/components/levha-preview"
import { WallColourPicker } from "@/components/wall-colour-picker"
import {
  backgroundOptions, finish, frameColours, letterOptions, levhaPrice, sameColour, submitLevhaRequest,
  type Background, type BackgroundMaterial, type FrameColour, type LetterMaterial, type Letters, type LevhaCatalogue,
} from "@/lib/levha"
import { buildPath, formatPrice, OrderError, type Locale } from "@/lib/products"
import type { ShowroomConfig, WallColour } from "@/lib/showroom"
import { cn } from "@/lib/utils"

type SizeChoice = { kind: "standard"; index: number } | { kind: "custom" } | null

/** Step-by-step levha builder: frame, size, background, letters, text, then price and order. */
export function LevhaConfigurator({ locale, levha, showroom }: { locale: Locale; levha: LevhaCatalogue | null; showroom: ShowroomConfig }) {
  const t = useTranslations("levha")
  const [wall, setWall] = useState<WallColour>(null)
  const [frame, setFrame] = useState<FrameColour | null>(null)
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>(null)
  const [customWidth, setCustomWidth] = useState("")
  const [customHeight, setCustomHeight] = useState("")
  const [background, setBackground] = useState<Background | null>(null)
  const [letters, setLetters] = useState<Letters | null>(null)
  const [textChoice, setTextChoice] = useState<string>("")
  const [customText, setCustomText] = useState("")
  const [customPart, setCustomPart] = useState("")

  if (!levha) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6"><h1 className="font-serif text-5xl">{t("title")}</h1><p className="mt-5 text-muted-foreground">{t("unavailable")}</p></div>
  }
  const { pricing, ayahs } = levha
  const standardSizes = pricing.sizes

  // Size: a standard size, or a valid custom one (whole cm, at least the minimum).
  const customSize = { width: Number(customWidth), height: Number(customHeight) }
  const customValid = Number.isInteger(customSize.width) && Number.isInteger(customSize.height) && customSize.width >= pricing.minWidth && customSize.height >= pricing.minHeight && customSize.width <= 1000 && customSize.height <= 1000
  const standard = sizeChoice?.kind === "standard" ? standardSizes[sizeChoice.index] : undefined
  // Only width and height are sent; the API prices the levha itself.
  const size = standard ? { width: standard.width, height: standard.height } : sizeChoice?.kind === "custom" && customValid ? customSize : null
  const previewSize = size ?? standardSizes[0]

  const chooseBackgroundMaterial = (material: BackgroundMaterial) => {
    const colour = backgroundOptions[material][0]
    const next = { material, colour } as Background
    setBackground(next)
    if (letters && sameColour(next, letters)) setLetters(firstLetterColour(letters.material, next))
  }
  const chooseBackgroundColour = (colour: Background["colour"]) => {
    if (!background) return
    const next = { ...background, colour } as Background
    setBackground(next)
    if (letters && sameColour(next, letters)) setLetters(firstLetterColour(letters.material, next))
  }
  const chooseLetterMaterial = (material: LetterMaterial) => background && setLetters(firstLetterColour(material, background))

  const ayah = ayahs.find(item => item.id === textChoice)
  const isCustomText = textChoice === "custom"
  const textDone = Boolean(ayah) || (isCustomText && customText.trim().length >= 2)
  const previewText: PreviewText | null = ayah ? { arabic: ayah.arabic, image: ayah.image }
    : isCustomText ? { arabic: customText.trim() || t("customPlaceholderPreview"), image: null }
    : ayahs[0] ? { arabic: ayahs[0].arabic, image: ayahs[0].image } : null

  const steps = { frame: Boolean(frame), size: Boolean(size), background: Boolean(background), letters: Boolean(letters), text: textDone }
  const complete = Object.values(steps).every(Boolean)
  const price = complete && size && background && letters ? levhaPrice(pricing, { size, background, letters }) : null

  const preview = <LevhaPreview config={showroom} wall={wall} frame={frame} size={previewSize} background={steps.size ? background : null} letters={steps.size ? letters : null} text={previewText} />

  return (
    <div className="mx-auto max-w-375 px-4 pb-20 pt-8 md:px-6 md:pb-28 md:pt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent-ink">{t("eyebrow")}</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">{t("title")}</h1>
      <span aria-hidden className="mt-4 block h-px w-10 bg-accent" />
      <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">{t("description")}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
        <div className="space-y-4">
          {/* Phones: the preview stays pinned under the header while choosing, cropped to the wall. */}
          <div className="sticky top-[134px] z-20 -mx-4 aspect-video overflow-hidden shadow-[0_10px_20px_-10px_rgba(0,0,0,0.6)] lg:hidden">{preview}</div>
          <div className="space-y-3 lg:hidden">
            <WallColourPicker value={wall} onChange={setWall} />
            <p className="text-xs leading-5 text-muted-foreground">{t("previewNote")}</p>
          </div>
          <Step number={1} title={t("steps.frame")} done={steps.frame} summary={frame ? t(`frames.${frame}`) : undefined}>
            <div className="grid grid-cols-3 gap-3">
              {frameColours.map(colour => (
                <Tile key={colour} label={t(`frames.${colour}`)} active={frame === colour} onClick={() => setFrame(colour)} swatch={finish("frame", colour)} />
              ))}
            </div>
          </Step>

          <Step number={2} title={t("steps.size")} done={steps.size} locked={!steps.frame} summary={size ? `${size.width} × ${size.height} cm` : undefined}>
            <div className="flex flex-wrap gap-2">
              {standardSizes.map((item, index) => (
                <Chip key={`${item.width}x${item.height}`} active={sizeChoice?.kind === "standard" && sizeChoice.index === index} onClick={() => setSizeChoice({ kind: "standard", index })}>
                  {item.width} × {item.height} cm
                </Chip>
              ))}
              <Chip active={sizeChoice?.kind === "custom"} onClick={() => setSizeChoice({ kind: "custom" })}>{t("customSize")}</Chip>
            </div>
            {sizeChoice?.kind === "custom" && (
              <div className="mt-4">
                <div className="flex items-end gap-3">
                  <NumberField id="levha-width" label={t("width")} value={customWidth} onChange={setCustomWidth} min={pricing.minWidth} />
                  <span className="pb-3 text-muted-foreground">×</span>
                  <NumberField id="levha-height" label={t("height")} value={customHeight} onChange={setCustomHeight} min={pricing.minHeight} />
                  <span className="pb-3 text-sm text-muted-foreground">cm</span>
                </div>
                <p className={cn("mt-2 text-xs", customWidth && customHeight && !customValid ? "text-destructive" : "text-muted-foreground")}>
                  {t("customSizeHint", { width: String(pricing.minWidth), height: String(pricing.minHeight) })}
                </p>
              </div>
            )}
          </Step>

          <Step number={3} title={t("steps.background")} done={steps.background} locked={!steps.size} summary={background ? `${t(`materials.${background.material}`)}, ${t(`colours.${background.colour}`)}` : undefined}>
            <MaterialPicker
              materials={Object.keys(backgroundOptions) as BackgroundMaterial[]}
              material={background?.material ?? null}
              onMaterial={chooseBackgroundMaterial}
              colours={background ? [...backgroundOptions[background.material]] : []}
              colour={background?.colour ?? null}
              onColour={colour => chooseBackgroundColour(colour as Background["colour"])}
              swatch={colour => finish("background", colour as Background["colour"], background?.material)}
              materialLabel={item => t(`materials.${item}`)}
              colourLabel={item => t(`colours.${item as Background["colour"]}`)}
            />
          </Step>

          <Step number={4} title={t("steps.letters")} done={steps.letters} locked={!steps.background} summary={letters ? `${t(`materials.${letters.material}`)}, ${t(`colours.${letters.colour}`)}` : undefined}>
            <MaterialPicker
              materials={Object.keys(letterOptions) as LetterMaterial[]}
              material={letters?.material ?? null}
              onMaterial={chooseLetterMaterial}
              colours={letters ? [...letterOptions[letters.material]] : []}
              colour={letters?.colour ?? null}
              onColour={colour => letters && setLetters({ ...letters, colour } as Letters)}
              swatch={colour => finish("letters", colour as Letters["colour"], letters?.material)}
              disabledColour={colour => Boolean(background && background.colour === colour)}
              disabledHint={t("sameColour")}
              materialLabel={item => t(`materials.${item}`)}
              colourLabel={item => t(`colours.${item as Letters["colour"]}`)}
            />
          </Step>

          <Step number={5} title={t("steps.text")} done={steps.text} locked={!steps.letters} summary={ayah ? ayah.name[locale] || ayah.name.bs : isCustomText && textDone ? t("ownText") : undefined}>
            <label htmlFor="levha-text" className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("chooseText")}</label>
            <select
              id="levha-text"
              value={textChoice}
              onChange={event => setTextChoice(event.target.value)}
              className="mt-2 h-12 w-full border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="" disabled>{t("chooseTextPlaceholder")}</option>
              {ayahs.map(item => <option key={item.id} value={item.id}>{item.name[locale] || item.name.bs}</option>)}
              <option value="custom">{t("ownTextOption")}</option>
            </select>
            {ayah && <p dir="rtl" lang="ar" className="mt-3 font-arabic text-2xl leading-relaxed text-foreground/90">{ayah.arabic}</p>}
            {isCustomText && (
              <div className="mt-4 space-y-3">
                <TextArea id="levha-own-text" label={t("ownTextLabel")} value={customText} onChange={setCustomText} placeholder={t("ownTextPlaceholder")} rows={3} />
                <TextArea id="levha-own-part" label={t("ownPartLabel")} value={customPart} onChange={setCustomPart} placeholder={t("ownPartPlaceholder")} rows={2} />
                <p className="text-xs leading-5 text-muted-foreground">{t("ownTextNote")}</p>
              </div>
            )}
          </Step>

          {complete && size && background && letters && frame && (
            <OrderStep
              locale={locale}
              price={price}
              ownText={isCustomText}
              configuration={{
                frame, size, background, letters,
                ayahId: ayah ? ayah.id : null,
                customAyah: isCustomText ? { text: customText.trim(), ...(customPart.trim() ? { part: customPart.trim() } : {}) } : null,
              }}
            />
          )}
        </div>

        <div className="hidden lg:block">
          <div className="space-y-4 lg:sticky lg:top-36">
            {preview}
            <WallColourPicker value={wall} onChange={setWall} />
            <p className="text-xs leading-5 text-muted-foreground">{t("previewNote")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** The first letter colour allowed with this background (never the same colour). */
function firstLetterColour(material: LetterMaterial, background: Background): Letters {
  const colour = letterOptions[material].find(item => item !== background.colour) ?? letterOptions[material][0]
  return { material, colour } as Letters
}

function OrderStep({ locale, price, ownText, configuration }: { locale: Locale; price: number | null; ownText: boolean; configuration: Parameters<typeof submitLevhaRequest>[0]["configuration"] }) {
  const t = useTranslations("levha")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [state, setState] = useState<{ status: "idle" | "sending" } | { status: "done"; number: string; price: number | null } | { status: "error"; message: string }>({ status: "idle" })
  const priceText = useMemo(() => price === null ? t("priceOnRequest") : formatPrice(price, locale), [price, locale, t])

  if (state.status === "done") {
    return (
      <section className="border border-accent/50 bg-card p-6" role="status">
        <p className="flex items-center gap-2 font-serif text-2xl"><Check className="h-5 w-5 text-accent" aria-hidden />{t("doneTitle")}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("doneText", { number: state.number })}</p>
        <Link href={buildPath(locale, "/shop")} className="mt-5 inline-flex h-11 items-center bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover">{t("backToShop")}</Link>
      </section>
    )
  }

  async function send(event: React.FormEvent) {
    event.preventDefault()
    setState({ status: "sending" })
    try {
      const result = await submitLevhaRequest({ locale, configuration, customer: { fullName: fullName.trim(), email: email.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) }, ...(notes.trim() ? { notes: notes.trim() } : {}) })
      setState({ status: "done", ...result })
    } catch (error) {
      setState({ status: "error", message: error instanceof OrderError ? error.message : "" })
    }
  }

  return (
    <section aria-labelledby="levha-order" className="border border-accent/50 bg-card p-6">
      <h2 id="levha-order" className="font-serif text-3xl">{t("steps.order")}</h2>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-y border-border py-4">
        <span className="text-sm text-muted-foreground">{t("price")}</span>
        <span className="text-3xl font-bold">{priceText}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{price === null ? t("priceOnRequestNote") : ownText ? t("priceOwnTextNote") : t("priceNote")}</p>
      <form onSubmit={send} className="mt-5 grid gap-3">
        <InputField id="levha-name" label={t("form.name")} value={fullName} onChange={setFullName} required minLength={2} autoComplete="name" />
        <div className="grid gap-3 sm:grid-cols-2">
          <InputField id="levha-email" label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
          <InputField id="levha-phone" label={t("form.phone")} type="tel" value={phone} onChange={setPhone} autoComplete="tel" />
        </div>
        <TextArea id="levha-notes" label={t("form.notes")} value={notes} onChange={setNotes} placeholder={t("form.notesPlaceholder")} rows={3} />
        {state.status === "error" && <p role="alert" className="text-sm text-destructive">{t("form.error")}{state.message ? ` (${state.message})` : ""}</p>}
        <button type="submit" disabled={state.status === "sending"} className="mt-1 h-12 bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-60">
          {state.status === "sending" ? t("form.sending") : t("form.submit")}
        </button>
      </form>
    </section>
  )
}

function Step({ number, title, done, locked = false, summary, children }: { number: number; title: string; done: boolean; locked?: boolean; summary?: string; children: React.ReactNode }) {
  const t = useTranslations("levha")
  return (
    <section className={cn("border bg-card/60 p-5 transition-opacity", done ? "border-accent/40" : "border-border", locked && "opacity-50")} aria-disabled={locked || undefined}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 font-serif text-2xl">
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-sans", done ? "border-accent bg-accent text-accent-foreground" : "border-border")}>
            {done ? <Check className="h-4 w-4" aria-hidden /> : number}
          </span>
          {title}
        </h2>
        {locked ? <Lock className="h-4 w-4 text-muted-foreground" aria-label={t("locked")} /> : summary && <span className="truncate text-sm text-accent-ink">{summary}</span>}
      </div>
      <fieldset disabled={locked} className="mt-4 min-w-0">{children}</fieldset>
    </section>
  )
}

function Tile({ label, active, onClick, swatch }: { label: string; active: boolean; onClick: () => void; swatch: React.CSSProperties }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("flex flex-col items-center gap-2 border-2 p-3 text-sm transition-colors", active ? "border-accent" : "border-border hover:border-foreground/50")}>
      <span aria-hidden className="block h-12 w-full rounded-sm shadow-inner" style={swatch} />
      {label}
    </button>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("border px-4 py-2 text-sm transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground")}>
      {children}
    </button>
  )
}

function MaterialPicker<M extends string>({ materials, material, onMaterial, colours, colour, onColour, swatch, disabledColour, disabledHint, materialLabel, colourLabel }: {
  materials: M[]; material: M | null; onMaterial: (material: M) => void
  materialLabel: (material: M) => string; colourLabel: (colour: string) => string
  colours: string[]; colour: string | null; onColour: (colour: string) => void
  swatch: (colour: string) => React.CSSProperties
  disabledColour?: (colour: string) => boolean
  disabledHint?: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {materials.map(item => <Chip key={item} active={material === item} onClick={() => onMaterial(item)}>{materialLabel(item)}</Chip>)}
      </div>
      {material && (
        <div className="grid grid-cols-3 gap-3">
          {colours.map(item => {
            const blocked = disabledColour?.(item) ?? false
            return (
              <button
                key={item}
                type="button"
                disabled={blocked}
                onClick={() => onColour(item)}
                aria-pressed={colour === item}
                title={blocked ? disabledHint : undefined}
                className={cn("flex flex-col items-center gap-2 border-2 p-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40", colour === item ? "border-accent" : "border-border hover:border-foreground/50")}
              >
                <span aria-hidden className="block h-12 w-full rounded-sm shadow-inner" style={swatch(item)} />
                {colourLabel(item)}
                {blocked && <span className="text-[11px] leading-4 text-muted-foreground">{disabledHint}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NumberField({ id, label, value, onChange, min }: { id: string; label: string; value: string; onChange: (value: string) => void; min: number }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</label>
      <input id={id} type="number" inputMode="numeric" min={min} max={1000} step={1} value={value} onChange={event => onChange(event.target.value)} className="mt-2 h-12 w-24 border border-input bg-transparent px-3 text-sm outline-none focus:border-accent" />
    </div>
  )
}

function InputField({ id, label, value, onChange, ...props }: { id: string; label: string; value: string; onChange: (value: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</label>
      <input id={id} value={value} onChange={event => onChange(event.target.value)} {...props} className="mt-2 h-12 w-full border border-input bg-transparent px-3 text-sm outline-none focus:border-accent" />
    </div>
  )
}

function TextArea({ id, label, value, onChange, placeholder, rows }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows: number }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</label>
      <textarea id={id} rows={rows} maxLength={2000} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full border border-input bg-transparent px-3 py-3 text-sm outline-none focus:border-accent" />
    </div>
  )
}
