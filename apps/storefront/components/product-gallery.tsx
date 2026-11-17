"use client"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { isSvg } from "@/lib/products"
import { useState } from "react"
import { useTranslations } from "next-intl"
import type { Locale, MediaAsset } from "@/lib/products"
import { cn } from "@/lib/utils"

export function ProductGallery({ images, locale }: { images: MediaAsset[]; locale: Locale }) {
  const t = useTranslations("product")
  const [selected, setSelected] = useState(0)
  const current = images[selected] ?? images[0]
  const step = (by: number) => setSelected(index => (index + by + images.length) % images.length)

  return (
    <div className="min-w-0 self-start">
      <div className="group relative aspect-square overflow-hidden bg-secondary">
        <Image unoptimized={isSvg(current.url)} src={current.url} alt={current.alt[locale]} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain p-3 sm:p-7" />
        {images.length > 1 && (
          <>
            <GalleryArrow side="left" label={t("previousImage")} onClick={() => step(-1)} />
            <GalleryArrow side="right" label={t("nextImage")} onClick={() => step(1)} />
            <p className="absolute bottom-3 right-3 bg-background/85 px-2.5 py-1 text-xs tabular-nums">{selected + 1} / {images.length}</p>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {images.map((image, index) => (
            <button key={image.id} type="button" aria-label={t("showImage", { number: index + 1 })} aria-pressed={selected === index} onClick={() => setSelected(index)} className={cn("relative h-20 w-20 shrink-0 overflow-hidden border-2 transition-colors", selected === index ? "border-primary" : "border-transparent opacity-75 hover:opacity-100")}>
              <Image unoptimized={isSvg(image.url)} src={image.url} alt={image.alt[locale]} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GalleryArrow({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-sm transition-opacity hover:bg-background sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
    </button>
  )
}
