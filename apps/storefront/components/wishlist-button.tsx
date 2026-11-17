"use client"

import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useWishlist } from "@/components/wishlist-provider"
import { cn } from "@/lib/utils"

/** Heart toggle for saving a product. Safe to place inside a card link. */
export function WishlistButton({ productId, productName, className, variant = "icon" }: { productId: string; productName: string; className?: string; variant?: "icon" | "full" }) {
  const { has, toggle } = useWishlist()
  const t = useTranslations("wishlist")
  const saved = has(productId)

  const onClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const added = toggle(productId)
    toast.success(added ? t("added", { name: productName }) : t("removed", { name: productName }))
  }

  if (variant === "full") {
    return (
      <button type="button" onClick={onClick} aria-pressed={saved} className={cn("inline-flex min-h-12 items-center justify-center gap-2 border border-border px-4 text-sm font-semibold transition-colors hover:border-foreground", className)}>
        <Heart className={cn("h-4.5 w-4.5", saved && "fill-accent text-accent-ink")} strokeWidth={1.6} aria-hidden />
        {saved ? t("saved") : t("save")}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? t("removeLabel", { name: productName }) : t("saveLabel", { name: productName })}
      className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-sm transition-transform hover:scale-110", className)}
    >
      <Heart className={cn("h-4.5 w-4.5", saved ? "fill-accent text-accent-ink" : "text-foreground")} strokeWidth={1.6} aria-hidden />
    </button>
  )
}
