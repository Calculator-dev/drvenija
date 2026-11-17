import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

/** Read-only stars; half stars round to the nearest whole star. */
export function StarRating({ value, className, label }: { value: number; className?: string; label?: string }) {
  const filled = Math.round(value)
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={label ?? `${value} / 5`}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} className={cn("h-4 w-4", star <= filled ? "fill-gold text-gold" : "fill-transparent text-border")} strokeWidth={1.5} aria-hidden />
      ))}
    </span>
  )
}
