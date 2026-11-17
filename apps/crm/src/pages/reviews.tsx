import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, RotateCcw, Star, X } from "lucide-react"
import { PageHeader } from "../components/page-header"
import { StatusBadge, type Tone } from "../components/status-badges"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { getReviews, updateReview } from "../lib/api"
import { formatDate } from "../lib/format"
import { localeLabel, reviewStatusLabels, sortReviews, type AdminReview, type ReviewStatus } from "../lib/marketing"
import { cn } from "../lib/utils"

const filters: Array<{ value: ReviewStatus | "all"; label: string }> = [
  { value: "all", label: "Sve" },
  { value: "pending", label: "Na čekanju" },
  { value: "approved", label: "Odobrene" },
  { value: "rejected", label: "Odbijene" },
]
const tones: Record<ReviewStatus, Tone> = { pending: "warning", approved: "success", rejected: "danger" }

export function ReviewsPage() {
  const cache = useQueryClient()
  const query = useQuery({ queryKey: ["reviews"], queryFn: getReviews })
  const [filter, setFilter] = useState<ReviewStatus | "all">("all")
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) => updateReview(id, status),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["reviews"] })
      void cache.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
  const all = sortReviews(query.data ?? [])
  const reviews = filter === "all" ? all : all.filter(review => review.status === filter)
  const count = (value: ReviewStatus | "all") => value === "all" ? all.length : all.filter(review => review.status === value).length

  return (
    <>
      <PageHeader eyebrow="Marketing" title="Recenzije" description="Recenzije kupaca prikazuju se na webshopu tek nakon odobrenja. Recenzije na čekanju su prikazane prve." />
      <div role="group" aria-label="Filtriraj po statusu" className="mt-6 flex flex-wrap gap-2">
        {filters.map(item => (
          <Button key={item.value} variant={filter === item.value ? "default" : "outline"} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>
            {item.label}{query.data && <span className="ml-2 text-xs opacity-80">{count(item.value)}</span>}
          </Button>
        ))}
      </div>
      {mutation.isError && <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Recenziju nije moguće sačuvati: {mutation.error.message}</p>}
      {query.isPending && <p role="status" className="mt-6 text-muted-foreground">Učitavanje…</p>}
      {!query.data && query.error && (
        <div className="mt-6"><p role="alert" className="text-destructive">Podatke nije moguće učitati: {query.error.message}</p><Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>Pokušaj ponovo</Button></div>
      )}
      {query.data && reviews.length === 0 && <Card className="mt-6 p-6 text-sm text-muted-foreground">{all.length === 0 ? "Još nema recenzija." : "Nema recenzija s ovim statusom."}</Card>}
      <ul className="mt-6 space-y-4">
        {reviews.map(review => (
          <li key={review.id}>
            <ReviewCard review={review} busy={mutation.isPending && mutation.variables?.id === review.id} onChange={status => mutation.mutate({ id: review.id, status })} />
          </li>
        ))}
      </ul>
    </>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Ocjena ${rating} od 5`}>
      {[1, 2, 3, 4, 5].map(value => <Star key={value} aria-hidden className={cn("h-4 w-4", value <= rating ? "fill-amber-400 text-amber-500" : "text-muted-foreground/40")} />)}
    </span>
  )
}

function ReviewCard({ review, busy, onChange }: { review: AdminReview; busy: boolean; onChange: (status: ReviewStatus) => void }) {
  return (
    <Card className={cn("p-6", review.status === "pending" && "border-amber-300")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-serif text-xl">{review.productName}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <Stars rating={review.rating} />
            <span>{review.authorName}</span>
            <span>{formatDate(review.createdAt)}</span>
            <span>{localeLabel(review.locale)}</span>
          </p>
        </div>
        <StatusBadge tone={tones[review.status]}>{reviewStatusLabels[review.status]}</StatusBadge>
      </div>
      <p className="mt-4 whitespace-pre-line text-sm leading-6">{review.body}</p>
      {review.reviewedAt && review.status !== "pending" && <p className="mt-3 text-xs text-muted-foreground">{reviewStatusLabels[review.status]} {formatDate(review.reviewedAt)}.</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        {review.status !== "approved" && <Button disabled={busy} onClick={() => onChange("approved")} aria-label={`Odobri recenziju: ${review.authorName}, ${review.productName}`}><Check className="mr-2 h-4 w-4" aria-hidden />Odobri</Button>}
        {review.status !== "rejected" && <Button variant="outline" disabled={busy} onClick={() => onChange("rejected")} className="border-red-300 text-red-700 hover:bg-red-50" aria-label={`Odbij recenziju: ${review.authorName}, ${review.productName}`}><X className="mr-2 h-4 w-4" aria-hidden />Odbij</Button>}
        {review.status !== "pending" && <Button variant="ghost" disabled={busy} onClick={() => onChange("pending")}><RotateCcw className="mr-2 h-4 w-4" aria-hidden />Vrati na čekanje</Button>}
        {busy && <span role="status" className="self-center text-sm text-muted-foreground">Čuvanje…</span>}
      </div>
    </Card>
  )
}
