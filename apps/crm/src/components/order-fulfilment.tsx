import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, CircleDollarSign, Truck, Undo2 } from "lucide-react"
import { updateOrderPayment, updateOrderStatus } from "../lib/api"
import { fulfilmentIndex, fulfilmentSteps, nextFulfilmentSteps, paymentMethodLabel, statusEmailMessage, type AdminOrderDetail, type FulfilmentTarget } from "../lib/admin-data"
import { formatDateTime } from "../lib/format"
import { cn } from "../lib/utils"
import { PaymentBadge } from "./status-badges"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Input } from "./ui/input"

function useRefreshOrder(id: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["orders"] })
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    void queryClient.invalidateQueries({ queryKey: ["order", id] })
  }
}

/** Payment method, payment status and the manual "paid" toggle. */
export function PaymentCard({ order }: { order: AdminOrderDetail }) {
  const refresh = useRefreshOrder(order.id)
  const [notice, setNotice] = useState("")
  const mutation = useMutation({
    mutationFn: (paymentStatus: "pending_manual" | "paid") => updateOrderPayment(order.id, paymentStatus),
    onSuccess: (_result, paymentStatus) => {
      refresh()
      setNotice(paymentStatus === "paid" ? "Narudžba je označena kao plaćena." : "Oznaka plaćanja je poništena.")
    },
  })
  const editable = order.status !== "declined" && order.paymentStatus !== "cancelled"

  return (
    <Card className="p-6">
      <h3 className="font-serif text-2xl">Plaćanje</h3>
      <dl className="mt-5 space-y-3 text-sm">
        <div><dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Način plaćanja</dt><dd className="mt-1">{paymentMethodLabel(order.paymentMethod)}</dd></div>
        <div><dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status plaćanja</dt><dd className="mt-1"><PaymentBadge status={order.paymentStatus} /></dd></div>
      </dl>
      {editable && (
        <div className="mt-5">
          {order.paymentStatus === "paid" ? (
            <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate("pending_manual")}>
              <Undo2 className="mr-2 h-4 w-4" aria-hidden />{mutation.isPending ? "Čuvanje…" : "Poništi oznaku plaćanja"}
            </Button>
          ) : (
            <Button disabled={mutation.isPending} onClick={() => mutation.mutate("paid")}>
              <CircleDollarSign className="mr-2 h-4 w-4" aria-hidden />{mutation.isPending ? "Čuvanje…" : "Označi kao plaćeno"}
            </Button>
          )}
        </div>
      )}
      {notice && !mutation.isError && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
      {mutation.isError && <p role="alert" className="mt-3 text-sm text-red-800">Plaćanje nije moguće sačuvati: {mutation.error.message}</p>}
    </Card>
  )
}

/** Step indicator and forward-only status changes for accepted orders. */
export function FulfilmentPanel({ order }: { order: AdminOrderDetail }) {
  const refresh = useRefreshOrder(order.id)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notify, setNotify] = useState(true)
  const [pending, setPending] = useState<{ status: FulfilmentTarget; label: string } | null>(null)
  const [message, setMessage] = useState("")
  const mutation = useMutation({
    mutationFn: (status: FulfilmentTarget) => updateOrderStatus(order.id, {
      status,
      notify,
      ...(trackingNumber.trim() ? { trackingNumber: trackingNumber.trim() } : {}),
    }),
    onSuccess: result => {
      refresh()
      setPending(null)
      setTrackingNumber("")
      setMessage(statusEmailMessage(result.notification))
    },
  })

  const current = fulfilmentIndex(order.status)
  const next = nextFulfilmentSteps(order.status)
  const shippedIndex = fulfilmentIndex("shipped")
  const canAddTracking = current < shippedIndex
  const missingTracking = pending && fulfilmentIndex(pending.status) >= shippedIndex && !trackingNumber.trim() && !order.trackingNumber

  return (
    <Card className="p-6">
      <h3 className="font-serif text-2xl">Izrada i dostava</h3>
      <ol className="mt-6 grid gap-3 sm:grid-cols-5" aria-label="Koraci izrade">
        {fulfilmentSteps.map((step, index) => {
          const done = index < current
          const active = index === current
          return (
            <li key={step.status} aria-current={active ? "step" : undefined} className="flex items-center gap-3 sm:flex-col sm:items-start">
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium", done && "border-primary bg-primary text-primary-foreground", active && "border-primary bg-primary/10 text-primary ring-2 ring-primary/30", !done && !active && "border-border text-muted-foreground")}>
                {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
              </span>
              <span className={cn("text-sm", active ? "font-medium" : "text-muted-foreground")}>
                {step.label}
                <span className="sr-only">{done ? " (završeno)" : active ? " (trenutni korak)" : ""}</span>
              </span>
            </li>
          )
        })}
      </ol>

      {order.trackingNumber && <p className="mt-6 text-sm">Broj za praćenje pošiljke: <span className="font-medium">{order.trackingNumber}</span></p>}
      <p className="mt-2 text-xs text-muted-foreground">{order.statusEmailSentAt ? `Posljednji email o statusu poslan ${formatDateTime(order.statusEmailSentAt)}.` : "Email o statusu izrade još nije poslan."}</p>

      {message && <p role="status" className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">{message}</p>}
      {mutation.isError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Status nije moguće promijeniti: {mutation.error.message}</p>}

      {next.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Narudžba je završena.</p>
      ) : (
        <fieldset disabled={mutation.isPending} className="mt-6 space-y-4 border-t border-border pt-5">
          <legend className="sr-only">Promjena statusa</legend>
          {canAddTracking && (
            <div className="max-w-sm space-y-2 text-sm">
              <label htmlFor="tracking-number" className="font-medium">Broj za praćenje pošiljke</label>
              <Input id="tracking-number" maxLength={120} value={trackingNumber} onChange={event => setTrackingNumber(event.target.value)} placeholder={order.trackingNumber ?? "npr. RR123456789BA"} aria-describedby="tracking-hint" />
              <p id="tracking-hint" className="text-xs leading-5 text-muted-foreground">Unesite ga prije koraka „Poslano“ kako bi ga kupac dobio u emailu.</p>
            </div>
          )}
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={notify} onChange={event => setNotify(event.target.checked)} className="h-4 w-4 accent-primary" />
            Pošalji email kupcu
          </label>
          {pending ? (
            <div role="alertdialog" aria-label="Potvrda promjene statusa" className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p>
                Status će biti promijenjen u „{pending.label}“. {notify ? "Kupac će dobiti email." : "Kupac neće dobiti email."}
                {missingTracking && " Broj za praćenje nije unesen."} Nastaviti?
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => mutation.mutate(pending.status)}>{mutation.isPending ? "Čuvanje…" : "Da, promijeni status"}</Button>
                <Button variant="ghost" onClick={() => setPending(null)} autoFocus>Odustani</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {next.map((step, index) => (
                <Button key={step.status} variant={index === 0 ? "default" : "outline"} onClick={() => { setMessage(""); setPending(step) }}>
                  {step.status === "shipped" && <Truck className="mr-2 h-4 w-4" aria-hidden />}
                  {index === 0 ? `Sljedeći korak: ${step.label}` : `Preskoči na: ${step.label}`}
                </Button>
              ))}
            </div>
          )}
        </fieldset>
      )}
    </Card>
  )
}
