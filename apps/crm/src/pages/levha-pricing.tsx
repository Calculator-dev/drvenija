import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useBlocker } from "react-router"
import { Plus, Save, Trash2 } from "lucide-react"
import { LevhaTabs } from "../components/levha-tabs"
import { PageHeader } from "../components/page-header"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Field } from "../components/ui/field"
import { Input } from "../components/ui/input"
import { ApiError, getLevhaPricing, saveLevhaPricing } from "../lib/api"
import {
  combinationRows, letterMaterials, materialLabel, MAX_SIZES, newSizeDraft, pricingDraft, pricingExample, pricingPayload,
  type LevhaPricing, type PricingDraft, type SizeDraft,
} from "../lib/levha"

export function LevhaPricingPage() {
  const query = useQuery({ queryKey: ["levha-pricing"], queryFn: getLevhaPricing })
  return (
    <>
      <PageHeader
        eyebrow="Levhe po mjeri"
        title="Cijene"
        description="Cjenovnik konfiguratora levhi. Webshop kupcu odmah prikazuje cijenu prema ovim postavkama, a API je ponovo računa kad kupac pošalje zahtjev."
      />
      <LevhaTabs />
      {query.isPending ? (
        <p role="status" className="mt-6 text-sm text-muted-foreground">Učitavanje…</p>
      ) : query.isError ? (
        <div role="alert" className="mt-6 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p>Cijene nije moguće učitati: {query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>Pokušaj ponovo</Button>
        </div>
      ) : (
        <PricingEditor pricing={query.data} />
      )}
    </>
  )
}

function PricingEditor({ pricing }: { pricing: LevhaPricing }) {
  const cache = useQueryClient()
  const [draft, setDraft] = useState<PricingDraft>(() => pricingDraft(pricing))
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState("")
  // Warn before leaving with unsaved edits, like the product and showroom forms.
  const [dirty, setDirty] = useState(false)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const mutation = useMutation({
    mutationFn: (body: LevhaPricing) => saveLevhaPricing(body),
    onSuccess: saved => {
      setDirty(false)
      setNotice("Cijene su sačuvane. Webshop odmah koristi nove cijene.")
      cache.setQueryData(["levha-pricing"], saved)
    },
  })

  function update(change: (current: PricingDraft) => PricingDraft) {
    setDraft(change)
    setDirty(true)
    setNotice("")
  }
  const setSize = (key: string, change: Partial<SizeDraft>) =>
    update(current => ({ ...current, sizes: current.sizes.map(size => (size.key === key ? { ...size, ...change } : size)) }))

  function save() {
    if (mutation.isPending) return
    const result = pricingPayload(draft)
    if (result.errors) { setErrors(result.errors); return }
    setErrors([])
    mutation.mutate(result.body)
  }

  // The live example uses the form as it is now, as soon as it is valid.
  const live = pricingPayload(draft).body
  const example = live ? pricingExample(live) : null
  const saveError = mutation.error instanceof ApiError && mutation.error.status === 400
    ? `Podaci nisu ispravni (${mutation.error.message}). Provjerite polja i pokušajte ponovo.`
    : mutation.error?.message

  return (
    <form className="mt-6 space-y-6" noValidate onSubmit={event => { event.preventDefault(); save() }}>
      {blocker.state === "blocked" && (
        <div role="alertdialog" aria-label="Nesačuvane izmjene" className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="flex-1">Imate nesačuvane izmjene cijena. Napustiti stranicu bez čuvanja?</p>
          <Button type="button" variant="outline" onClick={() => blocker.reset()}>Ostani</Button>
          <Button type="button" onClick={() => blocker.proceed()}>Napusti bez čuvanja</Button>
        </div>
      )}

      <Card className="p-6 text-sm leading-6">
        <h2 className="font-serif text-2xl">Kako se računa cijena</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>Standardna veličina: njena cijena iz liste ispod.</li>
          <li>Vlastita veličina (najmanje {live ? `${live.minWidth} × ${live.minHeight} cm` : "najmanja širina × visina"}) ili vlastiti tekst: kupac ne vidi cijenu i šalje upit. Vi provjerite da li se može izraditi i javite mu cijenu.</li>
          <li>Na osnovnu cijenu se dodaje doplata za materijal pozadine i doplata za materijal slova (zbir postotaka), a rezultat se zaokružuje na cijeli KM.</li>
        </ol>
        <p className="mt-3 rounded-lg bg-muted/60 p-3 font-medium" role="status" aria-live="polite">
          {example ?? "Ispravite greške u cijenama da vidite primjer."}
        </p>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="font-serif text-2xl">Standardne veličine</h2>
          <p className="mt-2 text-sm text-muted-foreground">Širina × visina u cm i osnovna cijena (pozadina i slova od šperploče) u cijelim KM. Od 1 do {MAX_SIZES} veličina, bez ponavljanja.</p>
        </div>
        <ul className="space-y-3">
          {draft.sizes.map((size, index) => (
            <li key={size.key} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Field label={`Širina ${index + 1} (cm)`}><Input type="number" min={10} max={1000} step={1} value={size.width} onChange={event => setSize(size.key, { width: event.target.value })} /></Field>
              <Field label={`Visina ${index + 1} (cm)`}><Input type="number" min={10} max={1000} step={1} value={size.height} onChange={event => setSize(size.key, { height: event.target.value })} /></Field>
              <Field label={`Cijena ${index + 1} (KM)`}><Input type="number" min={0} step={1} value={size.price} onChange={event => setSize(size.key, { price: event.target.value })} /></Field>
              <Button
                type="button"
                variant="outline"
                className="text-red-700 hover:bg-red-50"
                disabled={draft.sizes.length <= 1}
                aria-label={`Ukloni veličinu ${index + 1}`}
                onClick={() => update(current => ({ ...current, sizes: current.sizes.filter(item => item.key !== size.key) }))}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="outline" disabled={draft.sizes.length >= MAX_SIZES} onClick={() => update(current => ({ ...current, sizes: [...current.sizes, newSizeDraft()] }))}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />Dodaj veličinu
        </Button>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-serif text-2xl">Veličine po mjeri</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Najmanja širina (cm)" hint="Manje veličine se ne mogu naručiti.">
            <Input type="number" min={10} max={1000} step={1} value={draft.minWidth} onChange={event => update(current => ({ ...current, minWidth: event.target.value }))} />
          </Field>
          <Field label="Najmanja visina (cm)">
            <Input type="number" min={10} max={1000} step={1} value={draft.minHeight} onChange={event => update(current => ({ ...current, minHeight: event.target.value }))} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="font-serif text-2xl">Doplate za materijal</h2>
          <p className="mt-2 text-sm text-muted-foreground">Cijeli postotak osnovne cijene, od −100 do 1000. Negativan broj je popust. Doplate pozadine i slova se sabiraju.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Pozadina: šperploča (%)">
            <Input type="number" min={-100} max={1000} step={1} value={draft.backgroundSurchargePct.plywood} onChange={event => update(current => ({ ...current, backgroundSurchargePct: { ...current.backgroundSurchargePct, plywood: event.target.value } }))} />
          </Field>
          <Field label="Pozadina: pleksiglas (%)">
            <Input type="number" min={-100} max={1000} step={1} value={draft.backgroundSurchargePct.plexiglass} onChange={event => update(current => ({ ...current, backgroundSurchargePct: { ...current.backgroundSurchargePct, plexiglass: event.target.value } }))} />
          </Field>
          {letterMaterials.map(material => (
            <Field key={material} label={`Slova: ${materialLabel(material)} (%)`}>
              <Input type="number" min={-100} max={1000} step={1} value={draft.letterSurchargePct[material]} onChange={event => update(current => ({ ...current, letterSurchargePct: { ...current.letterSurchargePct, [material]: event.target.value } }))} />
            </Field>
          ))}
        </div>
      </Card>

      <Card className="overflow-x-auto p-6">
        <h2 className="font-serif text-2xl">Sve kombinacije standardnih veličina</h2>
        {live ? (
          <table className="mt-4 w-full text-left text-sm">
            <caption className="sr-only">Cijene po veličini, materijalu pozadine i materijalu slova</caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="pb-3 font-medium">Veličina</th>
                <th scope="col" className="pb-3 font-medium">Pozadina</th>
                {letterMaterials.map(material => <th key={material} scope="col" className="pb-3 font-medium">Slova: {materialLabel(material)}</th>)}
              </tr>
            </thead>
            <tbody>
              {combinationRows(live).map(row => (
                <tr key={row.key} className="border-t border-border">
                  <td className="py-3 pr-4">{row.size}</td>
                  <td className="py-3 pr-4">{row.background}</td>
                  {row.prices.map(cell => <td key={cell.letters} className="py-3 pr-4 tabular-nums">{cell.price}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Tabela se prikazuje kad su sva polja ispravna.</p>
        )}
      </Card>

      {errors.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <ul className="list-disc space-y-1 pl-5">{errors.map(error => <li key={error}>{error}</li>)}</ul>
        </div>
      )}
      {mutation.isError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Cijene nije moguće sačuvati: {saveError}</p>}
      {notice && <p role="status" className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">{notice}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          <Save className="mr-2 h-4 w-4" aria-hidden />
          {mutation.isPending ? "Čuvanje…" : "Sačuvaj cijene"}
        </Button>
        {dirty && !mutation.isPending && <span className="text-sm text-amber-800">Imate nesačuvane izmjene.</span>}
      </div>
    </form>
  )
}
