"use client"
import Image from "next/image"
import { isSvg } from "@/lib/products"
import { useState } from "react"
import { useTranslations } from "next-intl"
import type { Locale, MediaAsset } from "@/lib/products"

export function ProductGallery({ images, locale, badge }: { images: MediaAsset[]; locale: Locale; badge?: string }) {
  const t = useTranslations("product")
  const [selected, setSelected] = useState(0)
  const current = images[selected] ?? images[0]
  return <div className="flex min-w-0 flex-col gap-3.5 self-start">
    <div className="relative aspect-[4/4.6] overflow-hidden rounded-lg bg-muted">
      <Image unoptimized={isSvg(current.url)} src={current.url} alt={current.alt[locale]} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
      {badge && <span className="absolute left-4 top-4 rounded-full bg-night px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gold">{badge}</span>}
    </div>
    {images.length > 1 && <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">{images.map((image, index) => <button key={image.id} type="button" aria-label={t("showImage", { number: index + 1 })} aria-pressed={selected === index} onClick={() => setSelected(index)} className={`relative h-28 w-24 shrink-0 overflow-hidden rounded-md border-2 bg-muted ${selected === index ? "border-night" : "border-transparent hover:border-input"}`}><Image unoptimized={isSvg(image.url)} src={image.url} alt={image.alt[locale]} fill sizes="96px" className="object-cover" /></button>)}</div>}
  </div>
}
