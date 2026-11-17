import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { DataTable } from "../components/data-table"
import { PageHeader } from "../components/page-header"
import { StatusBadge, type Tone } from "../components/status-badges"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { control, Field } from "../components/ui/field"
import { Input } from "../components/ui/input"
import { ApiError, deleteDiscount, getDiscounts, saveDiscount } from "../lib/api"
import { formatMoney } from "../lib/format"
import { discountPayload, discountStatus, discountUsageLabel, discountValueLabel, discountWindowLabel, toDateTimeLocal, type AdminDiscount, type DiscountInput, type DiscountStatus } from "../lib/marketing"

const statusTones: Record<DiscountStatus, Tone> = { active: "success", scheduled: "warning", expired: "neutral", used_up: "neutral", inactive: "danger" }

export function DiscountsPage() {
  const cache = useQueryClient()
  const query = useQuery({ queryKey: ["discounts"], queryFn: getDiscounts })
  const [editing, setEditing] = useState<AdminDiscount | "new" | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AdminDiscount | null>(null)
  const [notice, setNotice] = useState("")
  const remove = useMutation({
    mutationFn: (discount: AdminDiscount) => deleteDiscount(discount.id),
    onSuccess: (_result, discount) => {
      void cache.invalidateQueries({ queryKey: ["discounts"] })
      setConfirmDelete(null)
      if (editing !== "new" && editing?.id === discount.id) setEditing(null)
      setNotice(`Kod ${discount.code} je obrisan.`)
    },
  })

  const rows = query.data?.map(discount => {
    const status = discountStatus(discount)
    return {
      id: discount.id,
      code: discount.code,
      value: discountValueLabel(discount),
      minSubtotal: discount.minSubtotal > 0 ? `od ${formatMoney(discount.minSubtotal)}` : "—",
      window: discountWindowLabel(discount),
      usage: discountUsageLabel(discount),
      status: status.label,
      statusKey: status.status,
    }
  })
  const byId = new Map(query.data?.map(discount => [discount.id, discount]))

  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        title="Popusti"
        description="Kodovi za popust koje kupci unose na blagajni. Iznosi su u cijelim KM; postotak se računa na cijenu proizvoda."
        actions={<Button onClick={() => { setNotice(""); setEditing("new") }}><Plus className="mr-2 h-4 w-4" aria-hidden />Novi kod</Button>}
      />
      {notice && <p role="status" className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">{notice}</p>}
      {editing && (
        <DiscountForm
          key={editing === "new" ? "new" : editing.id}
          discount={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSaved={saved => {
            void cache.invalidateQueries({ queryKey: ["discounts"] })
            setEditing(null)
            setNotice(editing === "new" ? `Kod ${saved.code} je kreiran.` : `Kod ${saved.code} je sačuvan.`)
          }}
        />
      )}
      {confirmDelete && (
        <div role="alertdialog" aria-label="Brisanje koda za popust" className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <p className="flex-1">Obrisati kod <span className="font-mono font-medium">{confirmDelete.code}</span>? Narudžbe koje su ga već koristile zadržavaju popust.</p>
          <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={remove.isPending} autoFocus>Odustani</Button>
          <Button className="bg-red-700 text-white hover:bg-red-800" onClick={() => remove.mutate(confirmDelete)} disabled={remove.isPending}>{remove.isPending ? "Brisanje…" : "Da, obriši"}</Button>
          {remove.isError && <p role="alert" className="w-full text-red-800">Kod nije moguće obrisati: {remove.error.message}</p>}
        </div>
      )}
      <DataTable
        query={{ data: rows, isPending: query.isPending, error: query.error, refetch: query.refetch }}
        columns={[
          { key: "code", label: "Kod", render: row => <span className="font-mono font-medium">{row.code}</span> },
          { key: "value", label: "Popust" },
          { key: "minSubtotal", label: "Minimalna narudžba" },
          { key: "window", label: "Važi" },
          { key: "usage", label: "Korišteno" },
          { key: "status", label: "Status", render: row => <StatusBadge tone={statusTones[row.statusKey]}>{row.status}</StatusBadge> },
          {
            key: "id",
            label: "Radnje",
            render: row => {
              const discount = byId.get(row.id)
              if (!discount) return null
              return (
                <span className="flex justify-end gap-2">
                  <Button variant="outline" aria-label={`Uredi kod ${row.code}`} onClick={() => { setNotice(""); setEditing(discount) }}><Pencil className="h-4 w-4" aria-hidden /></Button>
                  <Button variant="outline" className="text-red-700 hover:bg-red-50" aria-label={`Obriši kod ${row.code}`} onClick={() => { remove.reset(); setConfirmDelete(discount) }}><Trash2 className="h-4 w-4" aria-hidden /></Button>
                </span>
              )
            },
          },
        ]}
        emptyText="Još nema kodova za popust."
      />
    </>
  )
}

function DiscountForm({ discount, onCancel, onSaved }: { discount?: AdminDiscount; onCancel: () => void; onSaved: (saved: AdminDiscount) => void }) {
  const [errors, setErrors] = useState<string[]>([])
  const [kind, setKind] = useState(discount?.kind ?? "percent")
  const mutation = useMutation({
    mutationFn: (body: DiscountInput) => saveDiscount(discount?.id, body),
    onSuccess: onSaved,
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = discountPayload(new FormData(event.currentTarget))
    if (result.errors) { setErrors(result.errors); return }
    setErrors([])
    mutation.mutate(result.body)
  }

  const saveError = mutation.error instanceof ApiError && mutation.error.status === 409
    ? "Kod s tim nazivom već postoji. Odaberite drugi naziv."
    : mutation.error?.message

  return (
    <Card className="mt-6 p-6">
      <h2 className="font-serif text-2xl">{discount ? `Uredi kod ${discount.code}` : "Novi kod za popust"}</h2>
      <form onSubmit={submit} noValidate className="mt-5 space-y-5">
        <fieldset disabled={mutation.isPending} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <legend className="sr-only">Podaci o kodu</legend>
          <Field label="Kod *" hint="3–40 znakova: slova, brojevi, - i _. Čuva se velikim slovima.">
            <Input name="code" required minLength={3} maxLength={40} pattern="[A-Za-z0-9_\-]+" defaultValue={discount?.code ?? ""} className="font-mono uppercase" autoFocus placeholder="npr. PROLJECE10" />
          </Field>
          <Field label="Vrsta popusta *">
            <select name="kind" className={control} value={kind} onChange={event => setKind(event.target.value === "fixed" ? "fixed" : "percent")}>
              <option value="percent">Postotak (%)</option>
              <option value="fixed">Fiksni iznos (KM)</option>
            </select>
          </Field>
          <Field label={kind === "percent" ? "Vrijednost (%) *" : "Vrijednost (KM) *"}>
            <Input name="value" type="number" required min={1} max={kind === "percent" ? 100 : undefined} step={1} defaultValue={discount?.value ?? ""} />
          </Field>
          <Field label="Minimalna narudžba (KM)" hint="Iznos proizvoda potreban za kod. 0 znači bez minimuma.">
            <Input name="minSubtotal" type="number" min={0} step={1} defaultValue={discount?.minSubtotal ?? 0} />
          </Field>
          <Field label="Važi od" hint="Prazno: odmah.">
            <Input name="startsAt" type="datetime-local" defaultValue={toDateTimeLocal(discount?.startsAt ?? null)} />
          </Field>
          <Field label="Važi do" hint="Prazno: bez isteka.">
            <Input name="endsAt" type="datetime-local" defaultValue={toDateTimeLocal(discount?.endsAt ?? null)} />
          </Field>
          <Field label="Maksimalan broj korištenja" hint={discount ? `Do sada korišteno ${discount.usedCount} puta. Prazno: neograničeno.` : "Prazno: neograničeno."}>
            <Input name="maxUses" type="number" min={1} step={1} defaultValue={discount?.maxUses ?? ""} />
          </Field>
          <label className="flex items-center gap-3 self-center text-sm">
            <input type="checkbox" name="active" defaultChecked={discount?.active ?? true} className="h-4 w-4 accent-primary" />
            Kod je aktivan
          </label>
        </fieldset>
        {errors.length > 0 && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <ul className="list-disc space-y-1 pl-5">{errors.map(error => <li key={error}>{error}</li>)}</ul>
          </div>
        )}
        {mutation.isError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Kod nije moguće sačuvati: {saveError}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Čuvanje…" : discount ? "Sačuvaj izmjene" : "Kreiraj kod"}</Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={mutation.isPending}>Odustani</Button>
        </div>
      </form>
    </Card>
  )
}
