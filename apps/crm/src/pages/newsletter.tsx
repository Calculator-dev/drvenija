import { useQuery } from "@tanstack/react-query"
import { Download } from "lucide-react"
import { DataTable } from "../components/data-table"
import { PageHeader } from "../components/page-header"
import { Button } from "../components/ui/button"
import { getNewsletterSubscribers } from "../lib/api"
import { subscriberRows, subscribersCsv, type NewsletterSubscriber } from "../lib/marketing"

function downloadCsv(subscribers: NewsletterSubscriber[]) {
  // A byte-order mark lets Excel read the file as UTF-8.
  const blob = new Blob(["﻿", subscribersCsv(subscribers)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function NewsletterPage() {
  const query = useQuery({ queryKey: ["newsletter"], queryFn: getNewsletterSubscribers })
  const count = query.data?.length
  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        title="Newsletter"
        description={count === undefined ? "Aktivni pretplatnici newslettera." : `Aktivni pretplatnici newslettera: ${count}. Odjavljeni kupci se ne prikazuju.`}
        actions={<Button variant="outline" disabled={!query.data?.length} onClick={() => query.data && downloadCsv(query.data)}><Download className="mr-2 h-4 w-4" aria-hidden />Preuzmi CSV</Button>}
      />
      <DataTable
        query={{ data: query.data && subscriberRows(query.data), isPending: query.isPending, error: query.error, refetch: query.refetch }}
        columns={[{ key: "email", label: "Email" }, { key: "locale", label: "Jezik" }, { key: "createdAt", label: "Prijavljen" }]}
        emptyText="Još nema pretplatnika."
      />
    </>
  )
}
