"use client"

import Image from "next/image"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { WallPaintCanvas } from "@/components/wall-paint-canvas"
import { finish, frameFinish, frameWidthCm, type Background, type FrameColour, type Letters } from "@/lib/levha"
import { productPlacement, type ShowroomConfig, type WallColour } from "@/lib/showroom"

export type PreviewText = { arabic: string; image: { url: string } | null }

/**
 * The levha on the showroom wall at real size, built in layers as the customer chooses:
 * frame → size → background → letters. Nothing chosen yet shows the empty room.
 */
export function LevhaPreview({ config, wall, frame, size, background, letters, text, subtitle = null }: {
  config: ShowroomConfig
  wall: WallColour
  frame: FrameColour | null
  size: { width: number; height: number }
  background: Background | null
  letters: Letters | null
  text: PreviewText | null
  /** Line under the ayah (translation or the customer's own), drawn in a script font. */
  subtitle?: string | null
}) {
  const t = useTranslations("levha")
  const placement = productPlacement(config, size.width / size.height, { width: size.width, height: size.height })
  // Frame bar thickness as a share of the levha's width and height.
  const fx = (frameWidthCm / size.width) * 100
  const fy = (frameWidthCm / size.height) * 100

  return (
    <div className="relative isolate overflow-hidden rounded-sm border border-accent/25 bg-muted" style={{ aspectRatio: `${config.image.width} / ${config.image.height}` }}>
      <Image src={config.image.url} alt={t("previewAlt")} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
      <WallPaintCanvas config={config} colour={wall} />
      {frame ? (
        <div
          className="absolute transition-all duration-500"
          style={{ left: `${placement.left}%`, top: `${placement.top}%`, width: `${placement.width}%`, height: `${placement.height}%`, filter: "drop-shadow(0 12px 16px rgba(0,0,0,0.42))" }}
        >
          <FrameBars colour={frame} fx={fx} fy={fy} />
          {background && (
          <div className="absolute" style={{ left: `${fx}%`, right: `${fx}%`, top: `${fy}%`, bottom: `${fy}%` }}>
            <div
              className="relative h-full w-full overflow-hidden"
              style={{ ...finish("background", background.colour, background.material), boxShadow: "inset 0 3px 5px rgba(0,0,0,0.45), inset 2px 0 4px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.18)" }}
            >
              {background?.material === "plexiglass" && (
                // A soft diagonal reflection on glossy plexiglass.
                <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.14)_42%,transparent_55%)]" />
              )}
              {letters && text && (
                <div className={subtitle ? "absolute inset-x-[9%] bottom-[30%] top-[9%]" : "absolute inset-[9%]"} style={{ filter: raised }}>
                  {text.image ? (
                    <div
                      className="h-full w-full"
                      style={{
                        ...finish("letters", letters.colour, letters.material),
                        maskImage: `url("${text.image.url}")`, WebkitMaskImage: `url("${text.image.url}")`,
                        maskSize: "contain", WebkitMaskSize: "contain", maskPosition: "center", WebkitMaskPosition: "center",
                        maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat",
                      }}
                    />
                  ) : (
                    <FitText text={text.arabic} style={finish("letters", letters.colour, letters.material)} />
                  )}
                </div>
              )}
              {letters && subtitle && (
                <div className="absolute inset-x-[12%] bottom-[9%] h-[15%]" style={{ filter: raised }}>
                  <FitText text={subtitle} style={finish("letters", letters.colour, letters.material)} script="latin" />
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      ) : (
        <p className="absolute inset-x-0 top-[28%] mx-auto w-fit rounded-full bg-black/45 px-4 py-2 text-sm text-ivory">{t("previewEmpty")}</p>
      )}
    </div>
  )
}

/**
 * The frame as four bars mitred at the corners, like a real picture frame, so the grain
 * follows each bar. Each bar has the profile of the owner's frames: a lit outer edge, a flat
 * face, a step down and a thin inner lip against the panel. Light comes from the upper left.
 */
function FrameBars({ colour, fx, fy }: { colour: FrameColour; fx: number; fy: number }) {
  // From the outer edge (0%) to the panel (100%).
  const profile = (to: string, edge: number) => `linear-gradient(${to}, rgba(255,255,255,${edge}) 0%, rgba(255,255,255,0.06) 7%, rgba(0,0,0,0) 14%, rgba(0,0,0,0.04) 66%, rgba(0,0,0,0.38) 72%, rgba(0,0,0,0.16) 79%, rgba(255,255,255,0.07) 84%, rgba(0,0,0,0.04) 94%, rgba(0,0,0,0.3) 100%)`
  const bars = [
    { side: "top", to: "to bottom", tint: "rgba(0,0,0,0.04)", direction: "h", box: { left: 0, top: 0, width: "100%", height: `${fy}%` }, clip: `polygon(0 0, 100% 0, ${100 - fx}% 100%, ${fx}% 100%)` },
    { side: "bottom", to: "to top", tint: "rgba(0,0,0,0.16)", direction: "h", box: { left: 0, bottom: 0, width: "100%", height: `${fy}%` }, clip: `polygon(${fx}% 0, ${100 - fx}% 0, 100% 100%, 0 100%)` },
    { side: "left", to: "to right", tint: "rgba(255,255,255,0.06)", direction: "v", box: { left: 0, top: 0, width: `${fx}%`, height: "100%" }, clip: `polygon(0 0, 100% ${fy}%, 100% ${100 - fy}%, 0 100%)` },
    { side: "right", to: "to left", tint: "rgba(0,0,0,0.1)", direction: "v", box: { right: 0, top: 0, width: `${fx}%`, height: "100%" }, clip: `polygon(0 ${fy}%, 100% 0, 100% 100%, 0 ${100 - fy}%)` },
  ] as const
  return bars.map(bar => {
    const wood = frameFinish(colour, bar.direction)
    return (
      <div
        key={bar.side}
        aria-hidden
        className="absolute"
        style={{
          ...bar.box,
          clipPath: bar.clip,
          backgroundImage: `${profile(bar.to, bar.side === "top" || bar.side === "left" ? 0.32 : 0.1)}, linear-gradient(${bar.tint}, ${bar.tint}), ${wood.backgroundImage}`,
          backgroundSize: `100% 100%, 100% 100%, ${wood.backgroundSize ?? "100% 100%"}`,
        }}
      />
    )
  })
}

// Letters stand off the panel: a tight shadow for the edge and a softer one for depth.
const raised = "drop-shadow(0 1px 1px rgba(0,0,0,0.55)) drop-shadow(0 3px 3px rgba(0,0,0,0.28))"

/**
 * Text filled with the letter material, scaled to fill its box. Arabic is set right-to-left
 * in a calligraphic font on one or two lines; the line under the ayah in a script font.
 */
function FitText({ text, style, script = "arabic" }: { text: string; style: React.CSSProperties; script?: "arabic" | "latin" }) {
  const box = useRef<HTMLDivElement | null>(null)
  const measure = useRef<HTMLDivElement | null>(null)
  const [fontSize, setFontSize] = useState(0)
  const lines = script === "arabic" ? splitLines(text) : [text.trim()]
  const font = script === "arabic" ? "font-arabic leading-[1.35]" : "font-script leading-[1.3]"
  const dir = script === "arabic" ? "rtl" : "ltr"

  const fit = () => {
    const outer = box.current
    const natural = measure.current
    if (!outer || !natural || !natural.offsetWidth || !natural.offsetHeight) return
    // The hidden copy is set at 100px; scale it to the box.
    setFontSize(100 * Math.min(outer.clientWidth / natural.offsetWidth, outer.clientHeight / natural.offsetHeight))
  }

  useLayoutEffect(fit)
  useEffect(() => {
    const observer = new ResizeObserver(() => fit())
    if (box.current) observer.observe(box.current)
    void document.fonts?.ready.then(() => fit())
    return () => observer.disconnect()
  })

  const content = lines.map((line, index) => <span key={index} className="block">{line}</span>)
  return (
    <div ref={box} className="relative flex h-full w-full items-center justify-center">
      <div ref={measure} aria-hidden dir={dir} className={`pointer-events-none invisible absolute whitespace-nowrap ${font}`} style={{ fontSize: 100 }}>{content}</div>
      <div
        dir={dir}
        lang={script === "arabic" ? "ar" : undefined}
        className={`whitespace-nowrap text-center text-transparent ${font}`}
        style={{ ...style, fontSize, WebkitBackgroundClip: "text", backgroundClip: "text" }}
      >
        {content}
      </div>
    </div>
  )
}

/** Long texts go on two lines, split at the space nearest the middle. */
function splitLines(text: string) {
  const clean = text.trim().replace(/\s+/g, " ")
  if (clean.length <= 24) return [clean]
  const middle = clean.length / 2
  let best = -1
  for (let i = 0; i < clean.length; i++) if (clean[i] === " " && (best < 0 || Math.abs(i - middle) < Math.abs(best - middle))) best = i
  return best < 0 ? [clean] : [clean.slice(0, best), clean.slice(best + 1)]
}
