import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Boxes, LayoutDashboard, MessageSquareMore, PackageSearch, ShoppingCart, Sparkles } from "lucide-react"
import { EditProduct } from "./components/edit-product"
import { OrderDetails } from "./components/order-details"
import { ProductForm } from "./components/product-form"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Card } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { getDashboard, getInquiries, getOrders, getProducts } from "./lib/api"

const navigation = [
  { id: "dashboard", label: "Pregled", icon: LayoutDashboard },
  { id: "products", label: "Proizvodi", icon: Boxes },
  { id: "orders", label: "Narudžbe", icon: ShoppingCart },
  { id: "inquiries", label: "Upiti", icon: MessageSquareMore },
] as const

type SectionId = (typeof navigation)[number]["id"] | "new-product" | `edit-product:${string}` | `order:${string}`
function currentSection(): SectionId {
  if (typeof window === "undefined") return "dashboard"
  if (window.location.pathname === "/products/new") return "new-product"
  const edit = /^\/products\/([^/]+)\/edit$/.exec(window.location.pathname)
  if (edit) return `edit-product:${edit[1]}`
  const order = /^\/orders\/([^/]+)$/.exec(window.location.pathname)
  if (order) return `order:${order[1]}`
  return navigation.find(item => window.location.pathname === `/${item.id}`)?.id ?? "dashboard"
}

export function App() {
  const [section, setSection] = useState<SectionId>(currentSection)
  const [notice, setNotice] = useState("")
  useEffect(() => {
    const onPop = () => setSection(currentSection())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])
  function navigate(next: SectionId) {
    window.history.pushState(null, "", next.startsWith("edit-product:") ? `/products/${next.slice(13)}/edit` : next.startsWith("order:") ? `/orders/${next.slice(6)}` : next === "new-product" ? "/products/new" : next === "dashboard" ? "/" : `/${next}`)
    setSection(next)
    setNotice("")
    window.scrollTo(0, 0)
  }
  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard })
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const ordersQuery = useQuery({ queryKey: ["orders"], queryFn: getOrders })
  const inquiriesQuery = useQuery({ queryKey: ["inquiries"], queryFn: getInquiries })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-border bg-card/70 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-2xl">Drvenija</p>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">CRM</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = section === item.id || ((section === "new-product" || section.startsWith("edit-product:")) && item.id === "products") || (section.startsWith("order:") && item.id === "orders")
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="p-6 lg:p-8">
          <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Upravljanje</p>
              <h1 className="mt-2 font-serif text-4xl">Proizvodi, narudžbe, mediji i višejezični sadržaj</h1>
            </div>
            <div className="flex gap-3">
              <Input placeholder="Pretraži proizvode, narudžbe, kupce..." className="w-72" />
              <Button variant="outline" onClick={() => navigate("new-product")}>Novi proizvod</Button>
            </div>
          </header>

          {notice && <p role="status" className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">{notice}</p>}
          {section.startsWith("order:") && <OrderDetails id={section.slice(6)} onBack={() => navigate("orders")} />}
          {section.startsWith("edit-product:") && <EditProduct id={section.slice(13)} onCancel={() => navigate("products")} onSaved={() => { navigate("products"); setNotice("Proizvod je uspješno ažuriran.") }} />}
          {section === "new-product" && <ProductForm onCancel={() => navigate("products")} onSaved={() => { navigate("products"); setNotice("Proizvod je uspješno sačuvan.") }} />}
          {section === "products" && productsQuery.isPending && <p role="status" className="mt-6">Učitavanje proizvoda…</p>}
          {[dashboardQuery, productsQuery, ordersQuery].some(query => query.isError) && <p role="alert" className="mt-6 text-destructive">CRM podatke nije moguće učitati. Osvježite stranicu i pokušajte ponovo.</p>}

          {section === "dashboard" && (
            <div className="space-y-6 pt-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {dashboardQuery.data?.totals.map((item) => (
                  <Card key={item.label} className="p-5">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-3 font-serif text-4xl">{item.value}</p>
                  </Card>
                ))}
              </div>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Nedavne narudžbe</p>
                    <h2 className="mt-2 font-serif text-3xl">Ručna obrada narudžbi</h2>
                  </div>
                  <Badge>Supabase prijava spremna</Badge>
                </div>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="pb-3 font-medium">Narudžba</th>
                        <th className="pb-3 font-medium">Kupac</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Iznos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardQuery.data?.recentOrders.map((order) => (
                        <tr key={order.orderNumber} className="border-t border-border">
                          <td className="py-4">{order.orderNumber}</td>
                          <td className="py-4">{order.customer}</td>
                          <td className="py-4">{order.status}</td>
                          <td className="py-4">{order.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {section === "products" && (
            <SectionCard
              title="Upravljanje katalogom"
              description="Upravljajte proizvodima, prevodima, materijalima, cijenama, istaknutim statusom i tipovima proizvoda."
              rows={productsQuery.data ?? []}
              onEdit={row => navigate(`edit-product:${row.id}`)}
              columns={["sku", "name", "type", "price"]}
            />
          )}

          {section === "orders" && (
            <SectionCard
              title="Obrada narudžbi"
              description="Pregledajte narudžbe s ručnim plaćanjem, pratite proizvodnju i spremnost za dostavu."
              rows={ordersQuery.data ?? []}
              columns={["orderNumber", "customer", "status", "amount", "createdAt"]}
              onEdit={row => navigate(`order:${row.id}`)}
              actionLabel="Detalji"
            />
          )}

          {section === "inquiries" && (
            <SectionCard
              title="Upiti za izradu po mjeri"
              description="Evidentirajte zahtjeve za personalizirane proizvode i pretvorite ih u ponude ili proizvodne zadatke."
              rows={inquiriesQuery.data ?? []}
              columns={["client", "subject", "deadline", "status"]}
            />
          )}

        </main>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  description,
  rows,
  columns,
  onEdit,
  actionLabel = "Uredi",
}: {
  title: string
  description: string
  rows: Array<Record<string, string>>
  columns: string[]
  onEdit?: (row: Record<string, string>) => void
  actionLabel?: string
}) {
  return (
    <Card className="mt-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Modul</p>
          <h2 className="mt-2 font-serif text-3xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline">
          <PackageSearch className="mr-2 h-4 w-4" />
          Pregledaj
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column} className="pb-3 font-medium capitalize">
                  {columnLabel(column)}
                </th>
              ))}
              {onEdit && <th className="pb-3 font-medium"><span className="sr-only">Radnje</span></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={columns.length + (onEdit ? 1 : 0)} className="py-8 text-muted-foreground">Još nema stavki.</td></tr>}
            {rows.map((row, index) => (
              <tr key={`${title}-${index}`} className="border-t border-border">
                {columns.map((column) => (
                  <td key={column} className="py-4">
                    {displayValue(row[column])}
                  </td>
                ))}
                {onEdit && <td className="py-4 text-right"><Button variant="outline" onClick={() => onEdit(row)} aria-label={`${actionLabel} ${row.name || row.orderNumber || row.sku}`}>{actionLabel}</Button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

const columnLabels: Record<string, string> = {
  sku: "SKU", name: "Naziv", type: "Tip", price: "Cijena", orderNumber: "Narudžba", customer: "Kupac",
  status: "Status", amount: "Iznos", client: "Klijent", subject: "Predmet", deadline: "Rok",
  createdAt: "Datum",
}

function columnLabel(column: string) {
  return columnLabels[column] ?? column
}

function displayValue(value: string) {
  const translated: Record<string, string> = {
    standard: "Standardni", custom: "Personalizirani", active: "Aktivan", submitted: "Zaprimljena",
    confirmed: "Potvrđena", open: "Otvoren", quoted: "Ponuda poslana",
  }
  return translated[value.toLowerCase()] ?? value
}
