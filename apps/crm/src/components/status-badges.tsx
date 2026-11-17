import { paymentStatusLabel } from "../lib/admin-data"
import { Badge } from "./ui/badge"

export type Tone = "success" | "warning" | "danger" | "neutral"

const tones: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  danger: "bg-red-50 text-red-800 ring-1 ring-red-200",
  neutral: "",
}

export function StatusBadge({ tone, children }: { tone: Tone; children: string }) {
  return <Badge className={tones[tone]}>{children}</Badge>
}

const paymentTones: Record<string, Tone> = { paid: "success", pending_manual: "warning", cancelled: "neutral" }

export function PaymentBadge({ status }: { status: string }) {
  if (!status) return <span className="text-muted-foreground">—</span>
  return <StatusBadge tone={paymentTones[status] ?? "neutral"}>{paymentStatusLabel(status)}</StatusBadge>
}
