import Image from "next/image"
import { siteName } from "@/lib/products"
import { cn } from "@/lib/utils"

/** The Drvenija logo: the gold "D" with a leaf, and the lowercase wordmark with a gold dot. */
export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image src="/brand/logo-mark.png" alt="" width={29} height={32} priority={priority} className="h-8 w-auto" />
      <span className="font-serif text-[23px] leading-none tracking-tight sm:text-[26px]">
        {siteName.toLowerCase()}<span className="text-gold">.</span>
      </span>
    </span>
  )
}
