import { cn } from "@/lib/utils"

/** The eight-point star used as the site's only ornament. */
export function Rosette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={cn("shrink-0", className)}>
      <rect x="5" y="5" width="14" height="14" />
      <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
    </svg>
  )
}
