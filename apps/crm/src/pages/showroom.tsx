import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useBlocker } from "react-router"
import { Eraser, ImagePlus, Save, Undo2 } from "lucide-react"
import { PageHeader } from "../components/page-header"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Field } from "../components/ui/field"
import { Input } from "../components/ui/input"
import { ApiError, getShowroom, saveShowroom, uploadProductImage } from "../lib/api"
import { cn } from "../lib/utils"
import {
  addOutlinePoint, areaHeightCm, deltaToPercent, MAX_OUTLINE_POINTS, MIN_OUTLINE_POINTS, moveArea, moveOutlinePoint,
  outlineClipPath, outlineSvgPoints, pointerToPercent, removeOutlinePoint, resizeArea, SAMPLE_WALL_COLOUR, setAreaField,
  showroomDraft, showroomPayload, showroomSaveError, undoOutlinePoint, withNewPhoto, withoutPhoto,
  type ArtArea, type Corner, type OutlinePoint, type ShowroomDraft, type ShowroomImage, type ShowroomInput, type ShowroomSettings,
} from "../lib/showroom"

const photoTypes = ["image/jpeg", "image/png", "image/webp"]
type Tool = "area" | "wall"

export function ShowroomPage() {
  const query = useQuery({ queryKey: ["showroom"], queryFn: getShowroom })
  return (
    <>
      <PageHeader
        eyebrow="Webshop"
        title="Showroom"
        description="Fotografija sobe u kojoj kupci na webshopu vide proizvode na zidu, u stvarnoj veličini i u boji zida koju sami odaberu. Ovdje postavljate fotografiju, mjesto za sliku, obris zida i stvarnu širinu tog mjesta."
      />
      {query.isPending ? (
        <p role="status" className="mt-6 text-sm text-muted-foreground">Učitavanje…</p>
      ) : query.isError ? (
        <div role="alert" className="mt-6 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p>Postavke showrooma nije moguće učitati: {query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>Pokušaj ponovo</Button>
        </div>
      ) : (
        <ShowroomEditor settings={query.data} />
      )}
    </>
  )
}

function ShowroomEditor({ settings }: { settings: ShowroomSettings | null }) {
  const cache = useQueryClient()
  const [draft, setDraft] = useState<ShowroomDraft>(() => showroomDraft(settings))
  const [tool, setTool] = useState<Tool>("area")
  const [preview, setPreview] = useState(false)
  const [colour, setColour] = useState(SAMPLE_WALL_COLOUR)
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  // Warn before leaving with unsaved edits, like the product form.
  const [dirty, setDirty] = useState(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const mutation = useMutation({
    mutationFn: (body: ShowroomInput) => saveShowroom(body),
    onSuccess: () => {
      setDirty(false)
      setNotice("Showroom je sačuvan. Kupci na webshopu vide novu postavku.")
      void cache.invalidateQueries({ queryKey: ["showroom"] })
    },
  })

  function update(change: (current: ShowroomDraft) => ShowroomDraft) {
    setDraft(change)
    setDirty(true)
    setNotice("")
  }
  const setArea = (area: ArtArea) => update(current => ({ ...current, artArea: area }))
  const setOutline = (change: (outline: OutlinePoint[]) => OutlinePoint[]) => update(current => ({ ...current, wallOutline: change(current.wallOutline) }))

  async function upload(files: FileList | null) {
    const file = files?.[0]
    if (!file || uploading || mutation.isPending) return
    setUploadError("")
    if (!photoTypes.includes(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024) {
      setUploadError("Odaberite JPEG, PNG ili WebP fotografiju manju od 10 MB.")
      return
    }
    setUploading(true)
    try {
      const uploaded = await uploadProductImage(file)
      update(current => withNewPhoto(current, { id: uploaded.id, url: uploaded.url, width: uploaded.width, height: uploaded.height }))
      setTool("area")
    } catch (reason) {
      setUploadError(reason instanceof Error ? reason.message : "Učitavanje fotografije nije uspjelo. Pokušajte ponovo.")
    } finally {
      setUploading(false)
    }
  }

  function save() {
    if (mutation.isPending || uploading) return
    const result = showroomPayload(draft)
    if (result.errors) {
      setErrors(result.errors)
      return
    }
    setErrors([])
    mutation.mutate(result.body)
  }

  const busy = uploading || mutation.isPending
  const widthCm = Number(draft.areaWidthCm)
  const heightCm = draft.image ? areaHeightCm(draft.artArea, widthCm, draft.image) : null

  return (
    <div className="mt-6 space-y-6">
      {blocker.state === "blocked" && (
        <div role="alertdialog" aria-label="Nesačuvane izmjene" className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="flex-1">Imate nesačuvane izmjene showrooma. Napustiti stranicu bez čuvanja?</p>
          <Button type="button" variant="outline" onClick={() => blocker.reset()}>Ostani</Button>
          <Button type="button" onClick={() => blocker.proceed()}>Napusti bez čuvanja</Button>
        </div>
      )}
      {!settings && (
        <p className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
          Showroom još nije podešen. Dok ne sačuvate fotografiju sobe, webshop prikazuje svoju ugrađenu demo sobu.
        </p>
      )}

      <Card className="space-y-5 p-6">
        <div>
          <h2 className="font-serif text-2xl">1. Fotografija sobe</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vodoravna fotografija sobe s praznim zidom na kojem bi visila slika, npr. zid iznad sofe. Na zidu ne smije biti slika ni drugih predmeta, jer webshop na to mjesto postavlja proizvode. JPEG, PNG ili WebP do 10 MB. Nova fotografija vraća označeni prostor i obris zida na početne vrijednosti.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block space-y-2 text-sm font-medium">
            <span className="flex items-center gap-2"><ImagePlus className="h-4 w-4" aria-hidden />{draft.image ? "Zamijeni fotografiju" : "Dodaj fotografiju"}</span>
            <input
              type="file"
              accept={photoTypes.join(",")}
              disabled={busy}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border file:bg-background file:px-4 file:py-2"
              onChange={event => { void upload(event.target.files); event.target.value = "" }}
            />
          </label>
          {draft.image && (
            <Button type="button" variant="outline" disabled={busy} onClick={() => update(withoutPhoto)}>Ukloni fotografiju</Button>
          )}
        </div>
        {draft.image && <p className="text-xs text-muted-foreground">Ako uklonite fotografiju i sačuvate, webshop ponovo prikazuje ugrađenu demo sobu.</p>}
        {uploading && <p role="status" className="text-sm">Učitavanje fotografije…</p>}
        {uploadError && <p role="alert" className="text-sm text-destructive">{uploadError}</p>}
      </Card>

      <Card className="space-y-5 p-6">
        <div>
          <h2 className="font-serif text-2xl">2. Mjesto za sliku i obris zida</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Odaberite šta uređujete. <strong>Mjesto za sliku</strong> je pravougaonik na zidu gdje webshop postavlja proizvod: povucite ga da ga pomjerite, a ugao da promijenite veličinu. <strong>Obris zida</strong> označava vidljivi dio zida bez sofe, prozora, lampe i sl.: kliknite na fotografiju za svaku tačku oko zida, a postojeće tačke povucite da ih popravite. Kad kupac promijeni boju zida, boji se samo taj dio.
          </p>
        </div>
        {draft.image ? (
          <>
            <div role="group" aria-label="Alat za uređivanje" className="flex flex-wrap gap-2">
              <Button type="button" variant={tool === "area" ? "default" : "outline"} aria-pressed={tool === "area"} onClick={() => setTool("area")}>Mjesto za sliku</Button>
              <Button type="button" variant={tool === "wall" ? "default" : "outline"} aria-pressed={tool === "wall"} onClick={() => setTool("wall")}>Obris zida</Button>
            </div>
            <PhotoEditor
              image={draft.image}
              area={draft.artArea}
              outline={draft.wallOutline}
              tool={tool}
              preview={preview}
              colour={colour}
              disabled={busy}
              onArea={setArea}
              onOutline={setOutline}
            />
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Dodajte fotografiju sobe da biste na njoj označili mjesto za sliku i obris zida.
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <fieldset disabled={busy} className="space-y-3">
            <legend className="text-sm font-medium">Mjesto za sliku (u % fotografije)</legend>
            <p className="text-xs leading-5 text-muted-foreground">Za precizno podešavanje: x i y su udaljenost gornjeg lijevog ugla od lijeve i gornje ivice fotografije.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AreaField label="x (%)" field="x" area={draft.artArea} onChange={setArea} />
              <AreaField label="y (%)" field="y" area={draft.artArea} onChange={setArea} />
              <AreaField label="Širina (%)" field="width" area={draft.artArea} onChange={setArea} />
              <AreaField label="Visina (%)" field="height" area={draft.artArea} onChange={setArea} />
            </div>
          </fieldset>
          {draft.image && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Obris zida</p>
              <p className="text-xs leading-5 text-muted-foreground" aria-live="polite">
                {`${draft.wallOutline.length} ${pointsLabel(draft.wallOutline.length)} (najmanje ${MIN_OUTLINE_POINTS}, najviše ${MAX_OUTLINE_POINTS}).`}
                {tool === "wall" ? " Tačku možete pomjeriti i strelicama na tastaturi, a obrisati tipkom Delete." : " Odaberite „Obris zida“ iznad fotografije da dodajete tačke."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={busy || draft.wallOutline.length === 0} onClick={() => setOutline(undoOutlinePoint)}>
                  <Undo2 className="mr-2 h-4 w-4" aria-hidden />Poništi zadnju tačku
                </Button>
                <Button type="button" variant="outline" disabled={busy || draft.wallOutline.length === 0} onClick={() => { setOutline(() => []); setTool("wall") }}>
                  <Eraser className="mr-2 h-4 w-4" aria-hidden />Počni ispočetka
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={preview} onChange={event => setPreview(event.target.checked)} className="h-4 w-4 accent-primary" aria-describedby="preview-hint" />
                  Pregled boje zida
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <span>Boja</span>
                  <input type="color" value={colour} onChange={event => setColour(event.target.value)} className="h-8 w-10 cursor-pointer rounded border" />
                </label>
              </div>
              <p id="preview-hint" className="text-xs leading-5 text-muted-foreground">
                Oboji zid unutar obrisa probnom bojom, kao što će to vidjeti kupac. Ako je obojen i dio namještaja ili prozora, popravite tačke.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-serif text-2xl">3. Stvarna veličina</h2>
        <div className="max-w-sm">
          <Field
            label="Širina označenog prostora u cm *"
            hint="Koliko je u stvarnosti širok označeni pravougaonik na zidu, npr. 120. Na osnovu toga webshop crta proizvode u stvarnoj veličini. Cijeli broj od 20 do 1000."
          >
            <Input
              type="number"
              inputMode="numeric"
              min={20}
              max={1000}
              step={1}
              required
              disabled={busy}
              value={draft.areaWidthCm}
              onChange={event => { const value = event.target.value; update(current => ({ ...current, areaWidthCm: value })) }}
            />
          </Field>
        </div>
        {heightCm !== null && <p className="text-sm text-muted-foreground">{`Visina označenog prostora je tada oko ${heightCm} cm.`}</p>}
      </Card>

      {errors.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <ul className="list-disc space-y-1 pl-5">{errors.map(error => <li key={error}>{error}</li>)}</ul>
        </div>
      )}
      {mutation.isError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Showroom nije moguće sačuvati: {showroomSaveError({ message: mutation.error.message, status: mutation.error instanceof ApiError ? mutation.error.status : undefined })}
        </p>
      )}
      {notice && <p role="status" className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">{notice}</p>}
      <div className="flex items-center justify-end gap-3 border-t pt-5">
        {dirty && <span className="text-sm text-muted-foreground">Imate nesačuvane izmjene.</span>}
        <Button type="button" onClick={save} disabled={busy}>
          <Save className="mr-2 h-4 w-4" aria-hidden />
          {mutation.isPending ? "Čuvanje…" : "Sačuvaj"}
        </Button>
      </div>
    </div>
  )
}

function pointsLabel(count: number) {
  const lastTwo = count % 100
  if (count % 10 === 1 && lastTwo !== 11) return "tačka"
  if ([2, 3, 4].includes(count % 10) && (lastTwo < 12 || lastTwo > 14)) return "tačke"
  return "tačaka"
}

/** Numeric input that lets the owner type freely; the stored area is always clamped. */
function AreaField({ label, field, area, onChange }: { label: string; field: keyof ArtArea; area: ArtArea; onChange: (area: ArtArea) => void }) {
  const [text, setText] = useState<string | null>(null)
  return (
    <Field label={label}>
      <Input
        type="number"
        inputMode="decimal"
        min={field === "width" || field === "height" ? 2 : 0}
        max={100}
        step={0.1}
        value={text ?? String(area[field])}
        onChange={event => {
          setText(event.target.value)
          const value = Number.parseFloat(event.target.value)
          if (Number.isFinite(value)) onChange(setAreaField(area, field, value))
        }}
        onBlur={() => setText(null)}
      />
    </Field>
  )
}

type Drag =
  | { kind: "move"; start: ArtArea; x: number; y: number; rect: DOMRect }
  | { kind: "resize"; corner: Corner; start: ArtArea; x: number; y: number; rect: DOMRect }
  | { kind: "point"; index: number; rect: DOMRect }

const corners: Array<{ corner: Corner; className: string; label: string }> = [
  { corner: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize", label: "gore lijevo" },
  { corner: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize", label: "gore desno" },
  { corner: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize", label: "dolje lijevo" },
  { corner: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize", label: "dolje desno" },
]

/** The showroom photo with the draggable artwork area and the editable wall outline. */
function PhotoEditor({ image, area, outline, tool, preview, colour, disabled, onArea, onOutline }: {
  image: ShowroomImage
  area: ArtArea
  outline: OutlinePoint[]
  tool: Tool
  preview: boolean
  colour: string
  disabled: boolean
  onArea: (area: ArtArea) => void
  onOutline: (change: (outline: OutlinePoint[]) => OutlinePoint[]) => void
}) {
  const frame = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)

  function startDrag(event: ReactPointerEvent<HTMLElement>, next: (rect: DOMRect) => Drag) {
    if (disabled || event.button !== 0 || !frame.current) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = next(frame.current.getBoundingClientRect())
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current) return
    if (current.kind === "point") {
      const point = pointerToPercent(event.clientX, event.clientY, current.rect)
      onOutline(points => moveOutlinePoint(points, current.index, point))
      return
    }
    const [dx, dy] = deltaToPercent(event.clientX - current.x, event.clientY - current.y, current.rect)
    onArea(current.kind === "move" ? moveArea(current.start, dx, dy) : resizeArea(current.start, current.corner, dx, dy))
  }

  function addPoint(clientX: number, clientY: number) {
    if (disabled || tool !== "wall" || !frame.current) return
    const point = pointerToPercent(clientX, clientY, frame.current.getBoundingClientRect())
    onOutline(points => addOutlinePoint(points, point))
  }

  function nudgePoint(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.shiftKey ? 5 : 1
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault()
      onOutline(points => removeOutlinePoint(points, index))
      return
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    onOutline(points => points[index] ? moveOutlinePoint(points, index, [points[index][0] + move[0], points[index][1] + move[1]]) : points)
  }

  const endDrag = () => { drag.current = null }
  const editingArea = tool === "area" && !disabled
  const editingWall = tool === "wall" && !disabled

  return (
    <div className="space-y-2">
      <div
        ref={frame}
        className={cn("relative w-full select-none overflow-hidden rounded-md bg-muted", editingWall && "cursor-crosshair")}
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={event => addPoint(event.clientX, event.clientY)}
      >
        <img src={image.url} alt="Fotografija sobe za showroom" draggable={false} className="absolute inset-0 h-full w-full object-fill" />
        {preview && outline.length >= MIN_OUTLINE_POINTS && (
          <div
            aria-hidden
            data-testid="wall-preview"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: colour, mixBlendMode: "multiply", clipPath: outlineClipPath(outline) }}
          />
        )}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {outline.length >= MIN_OUTLINE_POINTS ? (
            <polygon points={outlineSvgPoints(outline)} fill={preview ? "none" : "rgba(16, 185, 129, 0.22)"} stroke="#059669" strokeWidth={2} strokeDasharray={tool === "wall" ? undefined : "6 4"} vectorEffect="non-scaling-stroke" />
          ) : outline.length > 0 ? (
            <polyline points={outlineSvgPoints(outline)} fill="none" stroke="#059669" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          ) : null}
        </svg>
        <div
          aria-label="Mjesto za sliku"
          className={cn(
            "absolute border-2 border-white outline-2 outline-primary",
            editingArea ? "cursor-move touch-none bg-white/20" : "pointer-events-none border-dashed bg-white/10",
          )}
          style={{ left: `${area.x}%`, top: `${area.y}%`, width: `${area.width}%`, height: `${area.height}%` }}
          onPointerDown={editingArea ? event => startDrag(event, rect => ({ kind: "move", start: area, x: event.clientX, y: event.clientY, rect })) : undefined}
          onClick={event => { if (tool === "area") event.stopPropagation() }}
        >
          <span className="pointer-events-none absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Slika</span>
          {editingArea && corners.map(({ corner, className, label }) => (
            <span
              key={corner}
              aria-hidden
              title={`Promijeni veličinu (${label})`}
              className={cn("absolute h-4 w-4 touch-none rounded-sm border-2 border-white bg-primary shadow", className)}
              onPointerDown={event => startDrag(event, rect => ({ kind: "resize", corner, start: area, x: event.clientX, y: event.clientY, rect }))}
            />
          ))}
        </div>
        {editingWall && outline.map(([x, y], index) => (
          <button
            key={index}
            type="button"
            aria-label={`Tačka ${index + 1} obrisa zida (${Math.round(x)} %, ${Math.round(y)} %)`}
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-white bg-emerald-600 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ left: `${x}%`, top: `${y}%` }}
            onPointerDown={event => startDrag(event, rect => ({ kind: "point", index, rect }))}
            onClick={event => event.stopPropagation()}
            onKeyDown={event => nudgePoint(event, index)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {tool === "area"
          ? "Povucite pravougaonik da ga pomjerite, a kvadratić na uglu da promijenite veličinu."
          : outline.length >= MAX_OUTLINE_POINTS
            ? `Dosegnut je najveći broj tačaka (${MAX_OUTLINE_POINTS}).`
            : "Kliknite na fotografiju da dodate tačku obrisa. Tačke idu redom oko zida; povucite tačku da je pomjerite."}
      </p>
    </div>
  )
}
