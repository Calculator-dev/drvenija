import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, EyeOff, Pencil, Plus } from "lucide-react"
import { checkerboard } from "../components/cutout-image"
import { DataTable } from "../components/data-table"
import { LevhaTabs } from "../components/levha-tabs"
import { PageHeader } from "../components/page-header"
import { StatusBadge } from "../components/status-badges"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { control, Field } from "../components/ui/field"
import { Input } from "../components/ui/input"
import { ApiError, getLevhaAyahs, saveLevhaAyah, uploadProductImage } from "../lib/api"
import {
  ayahDraft, ayahPayload, ayahSaveError, ayahSortOrder, ayahVisibilityBody, nextSortOrder,
  type AdminLevhaAyah, type AyahDraft, type LevhaAyahInput,
} from "../lib/levha"
import { cn } from "../lib/utils"

const calligraphyTypes = ["image/png", "image/webp"]
const errorStatus = (error: Error) => (error instanceof ApiError ? error.status : undefined)

export function LevhaTextsPage() {
  const cache = useQueryClient()
  const query = useQuery({ queryKey: ["levha-ayahs"], queryFn: getLevhaAyahs })
  const [editing, setEditing] = useState<AdminLevhaAyah | "new" | null>(null)
  const [notice, setNotice] = useState("")
  const visibility = useMutation({
    mutationFn: ({ ayah, active }: { ayah: AdminLevhaAyah; active: boolean }) => saveLevhaAyah(ayah.id, ayahVisibilityBody(ayah, active)),
    onMutate: () => setNotice(""),
    onSuccess: (_saved, { ayah, active }) => {
      void cache.invalidateQueries({ queryKey: ["levha-ayahs"] })
      setNotice(active ? `Tekst „${ayah.name.bs}“ je ponovo prikazan na webshopu.` : `Tekst „${ayah.name.bs}“ je sakriven s webshopa.`)
    },
  })

  const ayahs = ayahSortOrder(query.data ?? [])
  const byId = new Map(ayahs.map(ayah => [ayah.id, ayah]))
  const rows = query.data && ayahs.map(ayah => ({
    id: ayah.id,
    name: ayah.name.bs,
    nameEn: ayah.name.en,
    arabic: ayah.arabic,
    imageUrl: ayah.image?.url ?? null,
    active: ayah.active,
    sortOrder: ayah.sortOrder,
  }))

  return (
    <>
      <PageHeader
        eyebrow="Levhe po mjeri"
        title="Tekstovi"
        description="Ajeti, zikr i imena koje kupci biraju u konfiguratoru levhi. Webshop prikazuje aktivne tekstove po redoslijedu; skriveni tekstovi ostaju sačuvani i u starim zahtjevima."
        actions={<Button onClick={() => { setNotice(""); setEditing("new") }}><Plus className="mr-2 h-4 w-4" aria-hidden />Novi tekst</Button>}
      />
      <LevhaTabs />
      {notice && <p role="status" className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">{notice}</p>}
      {visibility.isError && <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Tekst nije moguće sačuvati: {ayahSaveError({ message: visibility.error.message, status: errorStatus(visibility.error) })}</p>}
      {editing && (
        <AyahForm
          key={editing === "new" ? "new" : editing.id}
          ayah={editing === "new" ? undefined : editing}
          sortOrder={nextSortOrder(ayahs)}
          onCancel={() => setEditing(null)}
          onSaved={saved => {
            void cache.invalidateQueries({ queryKey: ["levha-ayahs"] })
            setEditing(null)
            setNotice(editing === "new" ? `Tekst „${saved.name.bs}“ je dodan.` : `Tekst „${saved.name.bs}“ je sačuvan.`)
          }}
        />
      )}
      <DataTable
        query={{ data: rows || undefined, isPending: query.isPending, error: query.error, refetch: query.refetch }}
        columns={[
          { key: "sortOrder", label: "Red." },
          {
            key: "name",
            label: "Naziv",
            render: row => (
              <span>
                <span className="block font-medium">{row.name}</span>
                {row.nameEn !== row.name && <span className="block text-xs text-muted-foreground">{row.nameEn}</span>}
              </span>
            ),
          },
          {
            key: "arabic",
            label: "Arapski tekst",
            render: row => <p dir="rtl" lang="ar" className="line-clamp-2 max-w-md text-right text-xl leading-loose">{row.arabic}</p>,
          },
          {
            key: "imageUrl",
            label: "Kaligrafija",
            render: row => row.imageUrl
              ? <span className="block h-14 w-24 overflow-hidden rounded-md border" style={checkerboard}><img src={row.imageUrl} alt={`Kaligrafija: ${row.name}`} className="h-full w-full object-contain p-1" /></span>
              : <span className="text-xs text-muted-foreground">Font</span>,
          },
          { key: "active", label: "Status", render: row => <StatusBadge tone={row.active ? "success" : "neutral"}>{row.active ? "Aktivan" : "Sakriven"}</StatusBadge> },
          {
            key: "id",
            label: "Radnje",
            render: row => {
              const ayah = byId.get(row.id)
              if (!ayah) return null
              const busy = visibility.isPending && visibility.variables?.ayah.id === ayah.id
              return (
                <span className="flex justify-end gap-2">
                  <Button variant="outline" aria-label={`Uredi tekst ${row.name}`} onClick={() => { setNotice(""); setEditing(ayah) }}><Pencil className="h-4 w-4" aria-hidden /></Button>
                  <Button variant="outline" disabled={busy} onClick={() => visibility.mutate({ ayah, active: !ayah.active })} aria-label={`${ayah.active ? "Sakrij" : "Prikaži"} tekst ${row.name}`}>
                    {ayah.active ? <EyeOff className="mr-2 h-4 w-4" aria-hidden /> : <Eye className="mr-2 h-4 w-4" aria-hidden />}
                    {ayah.active ? "Sakrij" : "Prikaži"}
                  </Button>
                </span>
              )
            },
          },
        ]}
        emptyText="Još nema tekstova. Dodajte prvi tekst da bi ga kupci mogli odabrati."
      />
    </>
  )
}

export function AyahForm({ ayah, sortOrder, onCancel, onSaved }: { ayah?: AdminLevhaAyah; sortOrder: number; onCancel: () => void; onSaved: (saved: Pick<AdminLevhaAyah, "name">) => void }) {
  const [draft, setDraft] = useState<AyahDraft>(() => ayahDraft(ayah, sortOrder))
  const [errors, setErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const mutation = useMutation({
    mutationFn: (body: LevhaAyahInput) => saveLevhaAyah(ayah?.id, body),
    onSuccess: onSaved,
  })
  const set = (change: Partial<AyahDraft>) => setDraft(current => ({ ...current, ...change }))
  const busy = uploading || mutation.isPending

  async function upload(files: FileList | null) {
    const file = files?.[0]
    if (!file || busy) return
    setUploadError("")
    if (!calligraphyTypes.includes(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024) {
      setUploadError(file.type === "image/jpeg"
        ? "JPEG nema prozirnu pozadinu. Odaberite PNG ili WebP datoteku s prozirnom pozadinom."
        : "Odaberite PNG ili WebP datoteku manju od 10 MB.")
      return
    }
    setUploading(true)
    try {
      const uploaded = await uploadProductImage(file)
      set({ image: { id: uploaded.id, url: uploaded.url, width: uploaded.width, height: uploaded.height } })
    } catch (reason) {
      setUploadError(reason instanceof Error ? reason.message : "Učitavanje slike nije uspjelo. Pokušajte ponovo.")
    } finally {
      setUploading(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const result = ayahPayload(draft)
    if (result.errors) { setErrors(result.errors); return }
    setErrors([])
    mutation.mutate(result.body)
  }

  return (
    <Card className="mt-6 p-6">
      <h2 className="font-serif text-2xl">{ayah ? `Uredi tekst „${ayah.name.bs}“` : "Novi tekst"}</h2>
      <form onSubmit={submit} noValidate className="mt-5 space-y-6">
        <fieldset disabled={mutation.isPending} className="grid gap-4 md:grid-cols-2">
          <legend className="sr-only">Podaci o tekstu</legend>
          <Field label="Naziv na bosanskom *" hint="Kako kupac vidi tekst u listi, npr. „Ajetul-kursija“ ili „Bismillah“.">
            <Input value={draft.nameBs} maxLength={160} onChange={event => set({ nameBs: event.target.value })} autoFocus />
          </Field>
          <Field label="Naziv na engleskom" hint="Prazno: koristi se bosanski naziv.">
            <Input value={draft.nameEn} maxLength={160} onChange={event => set({ nameEn: event.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Tekst na arapskom *" hint="Cijeli tekst kako treba biti na levhi. Prikazuje se zdesna nalijevo.">
              <textarea
                dir="rtl"
                lang="ar"
                className={cn(control, "min-h-32 text-right text-2xl leading-loose")}
                value={draft.arabic}
                maxLength={5000}
                onChange={event => set({ arabic: event.target.value })}
              />
            </Field>
          </div>
          <Field label="Prijevod na bosanskom" hint="Kupac ga može odabrati kao tekst ispod ajeta. Prazno: bez prijevoda.">
            <Input value={draft.translationBs} maxLength={150} onChange={event => set({ translationBs: event.target.value })} />
          </Field>
          <Field label="Prijevod na engleskom" hint="Prazno: koristi se bosanski prijevod.">
            <Input value={draft.translationEn} maxLength={150} onChange={event => set({ translationEn: event.target.value })} />
          </Field>
          <Field label="Redoslijed" hint="Manji broj je prikazan prije u konfiguratoru.">
            <Input type="number" min={0} step={1} value={draft.sortOrder} onChange={event => set({ sortOrder: event.target.value })} />
          </Field>
          <label className="flex items-center gap-3 self-center text-sm">
            <input type="checkbox" checked={draft.active} onChange={event => set({ active: event.target.checked })} className="h-4 w-4 accent-primary" />
            Prikazan na webshopu
          </label>
        </fieldset>

        <section aria-labelledby="calligraphy-title" className="space-y-4 rounded-lg border p-5">
          <div>
            <h3 id="calligraphy-title" className="font-serif text-xl">Kaligrafija (slika)</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Kaligrafija izvezena iz CNC datoteke, u formatu PNG ili WebP s prozirnom pozadinom (do 10 MB). Slova mogu biti crna ili bilo koje boje, ali pozadina mora biti prozirna: webshop u pregledu koristi samo oblik slova i boji ih u boju slova koju kupac odabere. Bez slike webshop ispisuje arapski tekst kaligrafskim fontom. JPEG ne podržava prozirnost, zato nije dozvoljen.
            </p>
          </div>
          <label className="block space-y-2 text-sm font-medium">
            <span>{draft.image ? "Zamijeni sliku" : "Dodaj sliku"}</span>
            <input
              type="file"
              accept={calligraphyTypes.join(",")}
              disabled={busy}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border file:bg-background file:px-4 file:py-2"
              onChange={event => { void upload(event.target.files); event.target.value = "" }}
            />
          </label>
          {uploading && <p role="status" className="text-sm">Učitavanje slike…</p>}
          {uploadError && <p role="alert" className="text-sm text-destructive">{uploadError}</p>}
          {draft.image ? (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="relative aspect-4/3 overflow-hidden rounded-md border" style={checkerboard}>
                <img src={draft.image.url} alt={draft.imageAlt || `Kaligrafija: ${draft.nameBs || "novi tekst"}`} className="h-full w-full object-contain p-3" />
              </div>
              <div className="space-y-3">
                <label className="block space-y-1 text-xs">
                  <span>Opis slike (za čitače ekrana)</span>
                  <Input disabled={busy} value={draft.imageAlt} maxLength={300} placeholder={draft.nameBs || "Npr. Ajetul-kursija, kaligrafija"} onChange={event => set({ imageAlt: event.target.value })} />
                </label>
                <Button type="button" variant="outline" disabled={busy} onClick={() => set({ image: null })}>Ukloni sliku</Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nema slike — webshop ispisuje arapski tekst kaligrafskim fontom.</div>
          )}
        </section>

        {errors.length > 0 && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <ul className="list-disc space-y-1 pl-5">{errors.map(error => <li key={error}>{error}</li>)}</ul>
          </div>
        )}
        {mutation.isError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Tekst nije moguće sačuvati: {ayahSaveError({ message: mutation.error.message, status: errorStatus(mutation.error) })}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>{mutation.isPending ? "Čuvanje…" : ayah ? "Sačuvaj izmjene" : "Dodaj tekst"}</Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={mutation.isPending}>Odustani</Button>
        </div>
      </form>
    </Card>
  )
}
