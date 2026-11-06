import { Hammer, PenLine, ShieldCheck, Truck } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

/** Shop promises shown under the hero, on product pages and in the footer. */
export function TrustBar({ freeFrom, variant = "band", className }: { freeFrom: number; variant?: "band" | "compact"; className?: string }) {
  const t = useTranslations("trust")
  const items = [
    { icon: Truck, title: t("shippingTitle", { amount: String(freeFrom) }), text: t("shippingText") },
    { icon: Hammer, title: t("madeTitle"), text: t("madeText") },
    { icon: PenLine, title: t("personalTitle"), text: t("personalText") },
    { icon: ShieldCheck, title: t("confirmTitle"), text: t("confirmText") },
  ]

  if (variant === "compact") {
    return (
      <ul className={cn("grid gap-3 text-sm sm:grid-cols-2", className)}>
        {items.map(item => (
          <li key={item.title} className="flex items-start gap-3">
            <item.icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" strokeWidth={1.6} aria-hidden />
            <span className="leading-6 text-foreground/80">{item.title}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section aria-label={t("label")} className={cn("border-b border-border/70 bg-secondary", className)}>
      <ul className="mx-auto grid max-w-375 grid-cols-2 gap-x-4 gap-y-7 px-4 py-9 md:px-6 lg:grid-cols-4">
        {items.map(item => (
          <li key={item.title} className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background text-accent">
              <item.icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
