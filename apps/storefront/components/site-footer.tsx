import Link from "next/link"
import { buildPath, siteName, type Locale } from "@/lib/products"

export function SiteFooter({ locale }: { locale: Locale }) {
  const isBs = locale === "bs"
  const prefix = locale === "en" ? "/en" : ""

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-4 py-16 md:grid-cols-4 md:px-6 md:py-20">
        <div className="md:col-span-2">
          <p className="text-2xl font-black uppercase tracking-[-0.04em]">{siteName}</p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
            {isBs
              ? "Webshop za CNC proizvode od pleksiglasa i mediapana. Standardne artikle možete naručiti odmah, a za prilagođene komade šaljete kratki upit sa željenim dimenzijama i idejom."
              : "A webshop for CNC-cut plexiglass and MDF products. Standard products can be ordered directly, while tailored pieces can be requested with a short brief and dimensions."}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">{isBs ? "Navigacija" : "Navigation"}</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/80">
            <Link href={`${prefix}/shop`}>{isBs ? "Shop" : "Shop"}</Link>
            <Link href={`${prefix}/custom`}>{isBs ? "Custom izrada" : "Custom work"}</Link>
            <Link href={`${prefix}/about`}>{isBs ? "O nama" : "About"}</Link>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">{isBs ? "Kontakt" : "Contact"}</p>
          <div className="mt-4 space-y-3 text-sm text-white/60">
            <p>info@drvenija.ba</p>
            <p>+387 61 000 000</p>
            <p>{isBs ? "Sarajevo, BiH" : "Sarajevo, Bosnia and Herzegovina"}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-5 text-xs text-white/45 md:flex-row md:items-center md:justify-between md:px-6">
          <p>{isBs ? "Bosanski je primarni jezik webshopa." : "English is available as a secondary storefront language."}</p>
          <Link href={buildPath(locale)}>{isBs ? "Nazad na početnu" : "Back to home"}</Link>
        </div>
      </div>
    </footer>
  )
}
