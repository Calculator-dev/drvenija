"use client"

import { MessageCircle, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { viberLink, whatsappLink } from "@/lib/contact"
import { cn } from "@/lib/utils"

/**
 * Floating "Ask us" button that opens WhatsApp or Viber. The WhatsApp message already names the
 * page the visitor is on, so a question about a product arrives with its link.
 */
export function ChatButton() {
  const t = useTranslations("chat")
  const [open, setOpen] = useState(false)
  const [pageUrl, setPageUrl] = useState("")
  const panel = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    setPageUrl(window.location.href)
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !panel.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", close)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", close)
    }
  }, [open])

  const message = pageUrl ? t("message", { url: pageUrl }) : t("messageGeneric")

  return (
    <div ref={panel} className="fixed bottom-5 right-4 z-30 flex transition-[bottom] duration-300 max-lg:in-data-[sticky-bar]:bottom-22 flex-col items-end gap-3 print:hidden md:right-6">
      <div
        className={cn(
          "w-64 origin-bottom-right rounded-lg border border-border bg-background p-4 shadow-xl transition duration-200",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}
        inert={!open}
      >
        <p className="font-serif text-lg">{t("title")}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("text")}</p>
        <div className="mt-4 grid gap-2">
          <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-md bg-[#1f8f4e] text-sm font-semibold text-white transition-opacity hover:opacity-90">
            WhatsApp
          </a>
          <a href={viberLink()} className="flex h-11 items-center justify-center rounded-md bg-[#6f4bb8] text-sm font-semibold text-white transition-opacity hover:opacity-90">
            Viber
          </a>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("open")}
        className="flex h-14 items-center gap-2 rounded-full bg-brown px-5 text-sm font-semibold text-cream shadow-lg ring-1 ring-accent/40 transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5 text-accent" aria-hidden /> : <MessageCircle className="h-5 w-5 text-accent" aria-hidden />}
        <span className="hidden sm:inline">{t("open")}</span>
      </button>
    </div>
  )
}
