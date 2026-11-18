import { useState, type ReactNode } from "react"
import { uploadProductImage } from "../lib/api"
import type { RoomImage } from "../lib/admin-data"
import { cn } from "../lib/utils"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

type ImageCardProps = {
  image: RoomImage | null; onChange: (image: RoomImage | null) => void; onBusy: (busy: boolean) => void; disabled: boolean
}

/** Light/grey squares behind a transparent image, so see-through areas are visible. */
export const checkerboard = {
  backgroundColor: "#ffffff",
  backgroundImage: "repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)",
  backgroundSize: "20px 20px",
}

/**
 * One product photo that is kept apart from the gallery (the room photo or the cutout).
 * Uploads go to POST /admin/media; the product form sends the result when it is saved.
 */
function SingleImageCard({ image, onChange, onBusy, disabled, title, description, accept, fileError, emptyText, previewAlt, altPlaceholder, transparent = false }: ImageCardProps & {
  title: string
  description: ReactNode
  /** Allowed MIME types. */
  accept: string[]
  /** Message for a file of the wrong type or size. */
  fileError: (file: File) => string
  emptyText: string
  previewAlt: string
  altPlaceholder: string
  /** Show the preview whole on a checkerboard instead of cropping it. */
  transparent?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function upload(files: FileList | null) {
    const file = files?.[0]
    if (!file || busy || disabled) return
    setError("")
    if (!accept.includes(file.type) || file.size > 10 * 1024 * 1024 || file.size === 0) {
      setError(fileError(file))
      return
    }
    setBusy(true)
    onBusy(true)
    try {
      const uploaded = await uploadProductImage(file)
      onChange({ id: uploaded.id, url: uploaded.url, width: uploaded.width, height: uploaded.height, alt: image?.alt ?? { bs: "", en: "" } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Učitavanje slike nije uspjelo. Pokušajte ponovo.")
    } finally {
      setBusy(false)
      onBusy(false)
    }
  }

  const blocked = disabled || busy
  return (
    <Card className="space-y-5 p-6">
      <div>
        <h3 className="font-serif text-2xl">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <label className="block space-y-2 text-sm font-medium">
        <span>{image ? "Zamijeni sliku" : "Dodaj sliku"}</span>
        <input
          type="file"
          accept={accept.join(",")}
          disabled={blocked}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border file:bg-background file:px-4 file:py-2"
          onChange={event => { void upload(event.target.files); event.target.value = "" }}
        />
      </label>
      {busy && <p role="status" className="text-sm">Učitavanje slike…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {image ? (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className={cn("relative aspect-4/3 overflow-hidden rounded-md", transparent ? "border" : "bg-muted")} style={transparent ? checkerboard : undefined}>
            <img src={image.url} alt={image.alt.bs || previewAlt} className={cn("h-full w-full", transparent ? "object-contain p-3" : "object-cover")} />
          </div>
          <div className="space-y-3">
            <label className="block space-y-1 text-xs"><span>Opis na bosanskom</span><Input disabled={blocked} value={image.alt.bs} maxLength={300} placeholder={altPlaceholder} onChange={event => onChange({ ...image, alt: { ...image.alt, bs: event.target.value } })} /></label>
            <label className="block space-y-1 text-xs"><span>Opis na engleskom</span><Input disabled={blocked} value={image.alt.en} maxLength={300} placeholder="Opcionalni opis na engleskom" onChange={event => onChange({ ...image, alt: { ...image.alt, en: event.target.value } })} /></label>
            <Button type="button" variant="outline" disabled={blocked} onClick={() => onChange(null)}>Ukloni sliku</Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{emptyText}</div>
      )}
    </Card>
  )
}

/**
 * One photo of the product hanging in a real room. The storefront shows it in the
 * "Na vašem zidu" section instead of the drawn room; without it the drawing is used.
 */
export function RoomImageCard(props: ImageCardProps) {
  return (
    <SingleImageCard
      {...props}
      title="Slika u prostoru"
      description="Fotografija proizvoda na zidu u stvarnoj prostoriji, npr. iznad sofe ili u hodniku. Prikazuje se na stranici proizvoda u dijelu „Na vašem zidu“. Bez nje se prikazuje nacrtana soba. JPEG, PNG ili WebP do 10 MB; najbolje vodoravna fotografija."
      accept={["image/jpeg", "image/png", "image/webp"]}
      fileError={() => "Odaberite JPEG, PNG ili WebP datoteku manju od 10 MB."}
      emptyText="Nema slike u prostoru — na webshopu se prikazuje nacrtana soba."
      previewAlt="Proizvod u prostoru"
      altPlaceholder="Npr. Ajetul-kursija iznad sofe u dnevnoj sobi"
    />
  )
}

/**
 * The product on a transparent background. The storefront's showroom places it on the
 * wall of the showroom photo; without it the main photo is shown in a frame.
 */
export function CutoutImageCard(props: ImageCardProps) {
  return (
    <SingleImageCard
      {...props}
      title="Slika bez pozadine (showroom)"
      description="Fotografija samo proizvoda, bez pozadine (prozirna pozadina), u formatu PNG ili WebP do 10 MB. Showroom na webshopu je postavlja na zid sobe u stvarnoj veličini. Bez nje se u showroomu prikazuje glavna fotografija u okviru. JPEG ne podržava prozirnost, zato nije dozvoljen."
      accept={["image/png", "image/webp"]}
      fileError={file => file.type === "image/jpeg"
        ? "JPEG nema prozirnu pozadinu. Odaberite PNG ili WebP datoteku s prozirnom pozadinom."
        : "Odaberite PNG ili WebP datoteku manju od 10 MB."}
      emptyText="Nema slike bez pozadine — showroom na webshopu prikazuje glavnu fotografiju u okviru."
      previewAlt="Proizvod bez pozadine"
      altPlaceholder="Npr. Ajetul-kursija od pleksiglasa"
      transparent
    />
  )
}
