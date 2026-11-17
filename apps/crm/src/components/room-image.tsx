import { useState } from "react"
import { uploadProductImage } from "../lib/api"
import type { RoomImage } from "../lib/admin-data"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

/**
 * One photo of the product hanging in a real room. The storefront shows it in the
 * "Na vašem zidu" section instead of the drawn room; without it the drawing is used.
 */
export function RoomImageCard({ image, onChange, onBusy, disabled }: {
  image: RoomImage | null; onChange: (image: RoomImage | null) => void; onBusy: (busy: boolean) => void; disabled: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function upload(files: FileList | null) {
    const file = files?.[0]
    if (!file || busy || disabled) return
    setError("")
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024 || file.size === 0) {
      setError("Odaberite JPEG, PNG ili WebP datoteku manju od 10 MB.")
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
        <h3 className="font-serif text-2xl">Slika u prostoru</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Fotografija proizvoda na zidu u stvarnoj prostoriji, npr. iznad sofe ili u hodniku. Prikazuje se na stranici proizvoda u dijelu „Na vašem zidu“. Bez nje se prikazuje nacrtana soba. JPEG, PNG ili WebP do 10 MB; najbolje vodoravna fotografija.
        </p>
      </div>
      <label className="block space-y-2 text-sm font-medium">
        <span>{image ? "Zamijeni sliku" : "Dodaj sliku"}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={blocked}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border file:bg-background file:px-4 file:py-2"
          onChange={event => { void upload(event.target.files); event.target.value = "" }}
        />
      </label>
      {busy && <p role="status" className="text-sm">Učitavanje slike…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {image ? (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="relative aspect-4/3 overflow-hidden rounded-md bg-muted">
            <img src={image.url} alt={image.alt.bs || "Proizvod u prostoru"} className="h-full w-full object-cover" />
          </div>
          <div className="space-y-3">
            <label className="block space-y-1 text-xs"><span>Opis na bosanskom</span><Input disabled={blocked} value={image.alt.bs} maxLength={300} placeholder="Npr. Ajetul-kursija iznad sofe u dnevnoj sobi" onChange={event => onChange({ ...image, alt: { ...image.alt, bs: event.target.value } })} /></label>
            <label className="block space-y-1 text-xs"><span>Opis na engleskom</span><Input disabled={blocked} value={image.alt.en} maxLength={300} placeholder="Opcionalni opis na engleskom" onChange={event => onChange({ ...image, alt: { ...image.alt, en: event.target.value } })} /></label>
            <Button type="button" variant="outline" disabled={blocked} onClick={() => onChange(null)}>Ukloni sliku</Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nema slike u prostoru — na webshopu se prikazuje nacrtana soba.</div>
      )}
    </Card>
  )
}
