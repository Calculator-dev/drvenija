import { useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Check, Mail, Phone, X } from "lucide-react"
import { Link, useParams } from "react-router"
import { DataTable } from "../components/data-table"
import { LevhaTabs } from "../components/levha-tabs"
import { PageHeader } from "../components/page-header"
import { StatusBadge, type Tone } from "../components/status-badges"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { control } from "../components/ui/field"
import { getLevhaAyahs, getLevhaRequest, getLevhaRequests, updateLevhaRequest } from "../lib/api"
import { formatDateTime } from "../lib/format"
import {
  configurationSummary, priceLabel, requestRows, requestStatuses, requestStatusLabels, requestUpdateBody, textDirection,
  type AdminLevhaRequestDetail, type LevhaRequestStatus,
} from "../lib/levha"
import { localeLabel } from "../lib/marketing"
import { cn } from "../lib/utils"

export const levhaStatusTones: Record<LevhaRequestStatus, Tone> = { new: "warning", contacted: "neutral", accepted: "success", declined: "danger" }

export function LevhaStatusBadge({ status }: { status: LevhaRequestStatus }) {
  return <StatusBadge tone={levhaStatusTones[status] ?? "neutral"}>{requestStatusLabels[status] ?? status}</StatusBadge>
}

export function LevhaRequestsPage() {
  const query = useQuery({ queryKey: ["levha-requests"], queryFn: getLevhaRequests })
  const [filter, setFilter] = useState<LevhaRequestStatus | "all">("all")
  const all = query.data ? requestRows(query.data) : undefined
  const rows = all && filter !== "all" ? all.filter(row => row.statusKey === filter) : all
  const count = (value: LevhaRequestStatus | "all") => all ? (value === "all" ? all.length : all.filter(row => row.statusKey === value).length) : 0

  return (
    <>
      <PageHeader
        eyebrow="Prodaja"
        title="Levhe po mjeri"
        description="Zahtjevi iz konfiguratora levhi na webshopu. Kupac vidi cijenu iz cjenovnika ili „na upit“ za veće dimenzije; javite mu se da potvrdite narudžbu."
      />
      <LevhaTabs />
      <div role="group" aria-label="Filtriraj po statusu" className="mt-6 flex flex-wrap gap-2">
        {([["all", "Svi"], ...requestStatuses.map(status => [status, requestStatusLabels[status]])] as Array<[LevhaRequestStatus | "all", string]>).map(([value, label]) => (
          <Button key={value} variant={filter === value ? "default" : "outline"} aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {label}{all && <span className="ml-2 text-xs opacity-80">{count(value)}</span>}
          </Button>
        ))}
      </div>
      <DataTable
        query={{ data: rows, isPending: query.isPending, error: query.error, refetch: query.refetch }}
        columns={[
          { key: "number", label: "Broj", render: row => <span className="font-mono text-xs">{row.number}</span> },
          { key: "fullName", label: "Kupac" },
          { key: "text", label: "Tekst" },
          { key: "size", label: "Veličina" },
          { key: "price", label: "Cijena" },
          { key: "status", label: "Status", render: row => <LevhaStatusBadge status={row.statusKey} /> },
          { key: "createdAt", label: "Datum" },
        ]}
        rowHref={row => `/levha/${row.id}`}
        actionLabel="Detalji"
        emptyText={all && all.length > 0 ? "Nema zahtjeva s ovim statusom." : "Još nema zahtjeva za levhe."}
      />
    </>
  )
}

export function LevhaRequestPage() {
  const { id = "" } = useParams()
  const query = useQuery({ queryKey: ["levha-request", id], queryFn: () => getLevhaRequest(id) })
  const back = (
    <Link to="/levha" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden /> Nazad na zahtjeve
    </Link>
  )
  if (query.isPending) return <div className="space-y-4 pt-6">{back}<p role="status">Učitavanje zahtjeva…</p></div>
  if (!query.data) {
    return (
      <div className="space-y-4 pt-6">
        {back}
        <p role="alert" className="text-destructive">{query.error?.message ?? "Zahtjev nije moguće učitati."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>Pokušaj ponovo</Button>
      </div>
    )
  }
  return <LevhaRequestDetails key={query.data.id} request={query.data} back={back} />
}

function LevhaRequestDetails({ request, back }: { request: AdminLevhaRequestDetail; back: ReactNode }) {
  const cache = useQueryClient()
  const { configuration } = request
  const ayahs = useQuery({ queryKey: ["levha-ayahs"], queryFn: getLevhaAyahs, enabled: configuration.ayahId !== null })
  const ayah = configuration.ayahId ? ayahs.data?.find(item => item.id === configuration.ayahId) : undefined
  const [note, setNote] = useState(request.adminNote ?? "")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const mutation = useMutation({
    mutationFn: (input: { status: LevhaRequestStatus; adminNote: string; kind: "status" | "note" }) => {
      const result = requestUpdateBody(input.status, input.adminNote)
      if (!result.body) return Promise.reject(new Error(result.error))
      return updateLevhaRequest(request.id, result.body)
    },
    onMutate: () => { setNotice(""); setError("") },
    onSuccess: (saved, input) => {
      cache.setQueryData(["levha-request", request.id], saved)
      void cache.invalidateQueries({ queryKey: ["levha-requests"] })
      void cache.invalidateQueries({ queryKey: ["dashboard"] })
      setNotice(input.kind === "status" ? `Status je promijenjen u „${requestStatusLabels[saved.status]}“.` : "Interna bilješka je sačuvana.")
    },
    onError: reason => setError(reason.message),
  })
  const noteChanged = note.trim() !== (request.adminNote ?? "")
  const custom = configuration.customAyah

  return (
    <div className="space-y-6 pt-6">
      {back}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Levha po mjeri · <span className="font-mono">{request.number}</span></p>
          <h1 id="page-title" tabIndex={-1} className="mt-2 font-serif text-4xl outline-none">{request.fullName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Primljen {formatDateTime(request.createdAt)} · {localeLabel(request.locale).toLowerCase()}</p>
        </div>
        <LevhaStatusBadge status={request.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-serif text-2xl">Odabrana levha</h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              {configurationSummary(configuration).map(item => <Detail key={item.label} label={item.label} value={item.value} />)}
              <Detail label="Cijena prikazana kupcu" value={request.price === null ? "Na upit (veličina izvan cjenovnika)" : priceLabel(request.price)} />
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-2xl">Tekst</h2>
            {custom ? (
              <div className="mt-4 space-y-4 text-sm">
                <p className="text-muted-foreground">Kupac je upisao vlastiti tekst.</p>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tekst</p>
                  <p dir={textDirection(custom.text)} className={cn("mt-2 whitespace-pre-wrap rounded-lg bg-muted/50 p-4 leading-7", textDirection(custom.text) === "rtl" && "text-right text-2xl leading-loose")}>{custom.text}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Dio teksta za levhu</p>
                  {custom.part
                    ? <p dir={textDirection(custom.part)} className={cn("mt-2 whitespace-pre-wrap leading-7", textDirection(custom.part) === "rtl" && "text-right text-xl")}>{custom.part}</p>
                    : <p className="mt-2 text-muted-foreground">Nije navedeno (cijeli tekst).</p>}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-lg">{request.ayahName ?? "Tekst iz ponude"}</p>
                {ayah && <p dir="rtl" lang="ar" className="whitespace-pre-wrap text-right text-2xl leading-loose">{ayah.arabic}</p>}
                {ayahs.isSuccess && !ayah && <p className="text-muted-foreground">Ovaj tekst više nije u listi tekstova.</p>}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-2xl">Tekst ispod ajeta</h2>
            {request.subtitleText
              ? <>
                  <p className="mt-2 text-xs text-muted-foreground">{configuration.subtitle?.kind === "translation" ? "Prijevod ajeta" : "Vlastiti tekst kupca"}</p>
                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-lg leading-7">{request.subtitleText}</p>
                </>
              : <p className="mt-4 text-sm text-muted-foreground">Bez teksta ispod.</p>}
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-2xl">Napomena kupca</h2>
            {request.notes ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{request.notes}</p> : <p className="mt-4 text-sm text-muted-foreground">Kupac nije ostavio napomenu.</p>}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-serif text-2xl">Kontakt</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</dt><dd className="mt-1 wrap-break-word"><a href={`mailto:${request.email}`} className="underline underline-offset-4">{request.email}</a></dd></div>
              <div><dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Telefon</dt><dd className="mt-1">{request.phone ? <a href={`tel:${request.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">{request.phone}</a> : "Nije navedeno"}</dd></div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`mailto:${request.email}?subject=${encodeURIComponent(`Levha ${request.number}`)}`} className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground"><Mail className="mr-2 h-4 w-4" aria-hidden />Pošalji email</a>
              {request.phone && <a href={`tel:${request.phone.replace(/[^\d+]/g, "")}`} className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm hover:bg-muted"><Phone className="mr-2 h-4 w-4" aria-hidden />Pozovi</a>}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-2xl">Status</h2>
            <p className="mt-2 text-sm text-muted-foreground">Novi → Kontaktiran → Prihvaćen ili Odbijen. Kupcu se ne šalje email.</p>
            <div role="group" aria-label="Promijeni status" className="mt-4 flex flex-wrap gap-2">
              {requestStatuses.map(status => {
                const current = request.status === status
                return (
                  <Button
                    key={status}
                    type="button"
                    variant={current ? "default" : "outline"}
                    aria-pressed={current}
                    disabled={current || mutation.isPending}
                    className={cn(!current && status === "declined" && "border-red-300 text-red-700 hover:bg-red-50")}
                    onClick={() => mutation.mutate({ status, adminNote: note, kind: "status" })}
                  >
                    {status === "accepted" && <Check className="mr-2 h-4 w-4" aria-hidden />}
                    {status === "declined" && <X className="mr-2 h-4 w-4" aria-hidden />}
                    {requestStatusLabels[status]}
                  </Button>
                )
              })}
            </div>

            <label className="mt-6 block space-y-2 text-sm">
              <span className="font-medium">Interna bilješka</span>
              <textarea
                className={cn(control, "min-h-28")}
                value={note}
                maxLength={5000}
                disabled={mutation.isPending}
                placeholder="Npr. dogovorena cijena, rok izrade, šta je kupcu rečeno…"
                onChange={event => { setNote(event.target.value); setNotice("") }}
              />
              <span className="block text-xs text-muted-foreground">Vidljivo samo u CRM-u.</span>
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button type="button" disabled={mutation.isPending || !noteChanged} onClick={() => mutation.mutate({ status: request.status, adminNote: note, kind: "note" })}>
                {mutation.isPending ? "Čuvanje…" : "Sačuvaj bilješku"}
              </Button>
              {noteChanged && !mutation.isPending && <span className="text-xs text-amber-800">Bilješka nije sačuvana.</span>}
            </div>
            {notice && <p role="status" className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</p>}
            {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Promjenu nije moguće sačuvati: {error}</p>}
            <p className="mt-4 text-xs text-muted-foreground">Zadnja izmjena {formatDateTime(request.updatedAt)}.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</dt><dd className="mt-1">{value}</dd></div>
}
