import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { useTranslations } from "next-intl"
import { Logo } from "@/components/logo"
import { useCart } from "@/components/cart-provider"
import { buildPath, type Locale } from "@/lib/products"

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = useTranslations("footer")
  const common = useTranslations("common")
  const header = useTranslations("header")
  const trust = useTranslations("trust")
  const { shippingPolicy } = useCart()
  const prefix = locale === "en" ? "/en" : ""

  const shopLinks = [
    { href: `${prefix}/shop`, label: header("nav.allProducts") },
    { href: `${prefix}/shop?material=mediapan`, label: common("materials.mediapan") },
    { href: `${prefix}/shop?material=plexiglass`, label: common("materials.plexiglass") },
    { href: `${prefix}/shop?type=custom`, label: header("nav.customizable") },
  ]
  const infoLinks = [
    { href: `${prefix}/custom`, label: t("customWork") },
    { href: `${prefix}/about`, label: t("about") },
    { href: `${prefix}/cart`, label: common("cart") },
  ]

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="border-b border-white/12">
        <div className="mx-auto grid max-w-375 gap-6 px-4 py-8 text-sm sm:grid-cols-3 md:px-6">
          <p><span className="font-semibold">{trust("shippingTitle", { amount: String(shippingPolicy.freeFrom) })}</span><span className="block text-white/60">{trust("shippingText")}</span></p>
          <p><span className="font-semibold">{trust("madeTitle")}</span><span className="block text-white/60">{trust("madeText")}</span></p>
          <p><span className="font-semibold">{trust("confirmTitle")}</span><span className="block text-white/60">{trust("confirmText")}</span></p>
        </div>
      </div>

      <div className="mx-auto grid max-w-375 gap-10 px-4 py-14 sm:grid-cols-2 md:px-6 md:py-18 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <Link href={buildPath(locale)} aria-label="Drvenija"><Logo markClassName="h-10 w-10" innerClassName="fill-primary" /></Link>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/65">{t("description")}</p>
        </div>

        <FooterColumn title={common("shop")} links={shopLinks} />
        <FooterColumn title={t("information")} links={infoLinks} />

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/50">{t("contact")}</p>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li><a href="mailto:info@drvenija.ba" className="inline-flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden />info@drvenija.ba</a></li>
            <li><a href="tel:+38761000000" className="inline-flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" strokeWidth={1.5} aria-hidden />+387 61 000 000</a></li>
            <li className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" strokeWidth={1.5} aria-hidden />{t("location")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/12">
        <div className="mx-auto flex max-w-375 flex-col gap-3 px-4 py-5 text-xs text-white/50 md:flex-row md:items-center md:justify-between md:px-6">
          <p>{t("copyright", { year: String(new Date().getFullYear()) })}</p>
          <p>{t("languageNote")}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-white/50">{title}</p>
      <ul className="mt-4 flex flex-col gap-3 text-sm text-white/80">
        {links.map(link => <li key={link.href}><Link href={link.href} className="hover:text-white">{link.label}</Link></li>)}
      </ul>
    </div>
  )
}
