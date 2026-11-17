import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useLocation } from "react-router"
import { DataTable } from "../components/data-table"
import { PageHeader } from "../components/page-header"
import { StatusBadge } from "../components/status-badges"
import { Button, buttonVariants } from "../components/ui/button"
import { ImageOff } from "lucide-react"
import { getProducts, setProductPublished } from "../lib/api"

export function ProductsPage() {
  const cache = useQueryClient()
  const query = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [publishNotice, setPublishNotice] = useState("")
  const publish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean; name: string }) => setProductPublished(id, published),
    onSuccess: (result, { name }) => {
      void cache.invalidateQueries({ queryKey: ["products"] })
      void cache.invalidateQueries({ queryKey: ["product", result.id] })
      setPublishNotice(result.published ? `„${name}“ je objavljen na webshopu.` : `„${name}“ je sakriven s webshopa (skica).`)
    },
  })
  return (
    <>
      <PageHeader
        eyebrow="Katalog"
        title="Proizvodi"
        description="Upravljajte proizvodima, prevodima, materijalima, cijenama, istaknutim statusom i tipovima proizvoda."
        actions={<Link to="/products/new" className={buttonVariants()}>Novi proizvod</Link>}
      />
      {notice && <p role="status" className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">{notice}</p>}
      {publishNotice && !publish.isError && <p role="status" className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">{publishNotice}</p>}
      {publish.isError && <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Objavu nije moguće promijeniti: {publish.error.message}</p>}
      <DataTable
        query={query}
        columns={[
          {
            key: "thumbnailUrl",
            label: "Slika",
            render: row => row.thumbnailUrl ? (
              <img src={row.thumbnailUrl} alt="" loading="lazy" className="h-14 w-14 rounded-md border border-border bg-muted object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-border bg-muted text-muted-foreground" title="Nema slike">
                <ImageOff className="h-5 w-5" aria-hidden />
                <span className="sr-only">Nema slike</span>
              </span>
            ),
          },
          { key: "name", label: "Naziv" },
          { key: "sku", label: "SKU" },
          { key: "type", label: "Tip" },
          { key: "price", label: "Cijena" },
          {
            key: "published",
            label: "Webshop",
            render: row => {
              const busy = publish.isPending && publish.variables?.id === row.id
              return (
                <span className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={row.published ? "success" : "neutral"}>{row.published ? "Objavljeno" : "Skica"}</StatusBadge>
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-xs underline underline-offset-4"
                    disabled={busy}
                    aria-label={`${row.published ? "Sakrij s webshopa" : "Objavi na webshopu"}: ${row.name}`}
                    onClick={() => publish.mutate({ id: row.id, published: !row.published, name: row.name })}
                  >
                    {busy ? "Čuvanje…" : row.published ? "Sakrij" : "Objavi"}
                  </Button>
                </span>
              )
            },
          },
        ]}
        rowHref={row => `/products/${row.id}/edit`}
        rowLabel={row => row.name}
        emptyText="Još nema proizvoda. Dodajte prvi proizvod."
      />
    </>
  )
}
