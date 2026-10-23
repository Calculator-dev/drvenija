import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { buildPath, siteName, type Locale } from "@/lib/products"

const linkClass = "text-[#e9e4da] transition-colors hover:text-gold"

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = useTranslations("footer")
  const common = useTranslations("common")
  const header = useTranslations("header")
  const prefix = locale === "en" ? "/en" : ""

  return (
    <footer className="bg-night text-[#b5ada0]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 md:px-10 md:py-18 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="flex max-w-sm flex-col gap-4">
          <p className="flex items-center gap-3">
            <Image src="/brand/logo-mark.png" alt="" width={29} height={32} />
            <span className="font-serif text-[26px] leading-none text-[#f4efe6]">{siteName.toLowerCase()}<span className="text-gold">.</span></span>
          </p>
          <p className="text-sm leading-6">{t("description")}</p>
        </div>

        <nav aria-label={common("shop")} className="flex flex-col gap-2.5 text-sm">
          <p className="mb-1 font-semibold text-[#f4efe6]">{common("shop")}</p>
          <Link className={linkClass} href={`${prefix}/shop`}>{header("nav.allProducts")}</Link>
          <Link className={linkClass} href={`${prefix}/shop?material=plexiglass`}>{common("materials.plexiglass")}</Link>
          <Link className={linkClass} href={`${prefix}/shop?material=mediapan`}>{common("materials.mediapan")}</Link>
          <Link className={linkClass} href={`${prefix}/shop?type=custom`}>{header("nav.customizable")}</Link>
        </nav>

        <nav aria-label={t("navigation")} className="flex flex-col gap-2.5 text-sm">
          <p className="mb-1 font-semibold text-[#f4efe6]">{siteName}</p>
          <Link className={linkClass} href={`${prefix}/custom`}>{t("customWork")}</Link>
          <Link className={linkClass} href={`${prefix}/about`}>{t("about")}</Link>
        </nav>

        <div className="flex flex-col gap-2.5 text-sm">
          <p className="mb-1 font-semibold text-[#f4efe6]">{t("contact")}</p>
          <p>info@drvenija.ba</p>
          <p>+387 61 000 000</p>
          <p>{t("location")}</p>
          <a className={linkClass} href="https://www.instagram.com/drvenija/">Instagram</a>
        </div>
      </div>
      <div className="border-t border-night-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-[13px] md:flex-row md:items-center md:justify-between md:px-10">
          <p>{t("languageNote")}</p>
          <Link className={linkClass} href={buildPath(locale)}>{t("backHome")}</Link>
        </div>
      </div>
    </footer>
  )
}
