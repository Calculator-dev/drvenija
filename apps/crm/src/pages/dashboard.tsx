import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { DataTable } from "../components/data-table"
import { PageHeader } from "../components/page-header"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { getDashboard } from "../lib/api"

export function DashboardPage() {
  const query = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard })
  return (
    <>
      <PageHeader eyebrow="Upravljanje" title="Pregled" description="Današnje stanje narudžbi, proizvodnje, upita, levhi i recenzija." />
      {query.isError && !query.data && (
        <div className="mt-6"><p role="alert" className="text-destructive">Pregled nije moguće učitati: {query.error.message}</p><Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>Pokušaj ponovo</Button></div>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        {query.data?.totals.map(item => item.href ? (
          <Link key={item.label} to={item.href} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full p-5 transition-colors hover:bg-muted/60">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-3 font-serif text-4xl">{item.value}</p>
              <p className="mt-2 text-xs underline underline-offset-4">Pregledaj</p>
            </Card>
          </Link>
        ) : (
          <Card key={item.label} className="p-5">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-3 font-serif text-4xl">{item.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-serif text-3xl">Nedavne narudžbe</h2>
        <Link to="/orders" className="text-sm underline underline-offset-4">Sve narudžbe</Link>
      </div>
      <DataTable
        query={{ data: query.data?.recentOrders, isPending: query.isPending, error: query.error, refetch: query.refetch }}
        columns={[{ key: "orderNumber", label: "Narudžba" }, { key: "customer", label: "Kupac" }, { key: "status", label: "Status" }, { key: "amount", label: "Iznos" }]}
        rowHref={row => `/orders/${row.id}`}
        actionLabel="Detalji"
        emptyText="Još nema narudžbi."
      />
    </>
  )
}
