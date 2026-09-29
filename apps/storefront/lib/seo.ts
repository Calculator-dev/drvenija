import type { Metadata } from "next"
import {
  buildPath,
  defaultLocale,
  getLocalizedField,
  siteDescription,
  siteName,
  type Locale,
  type LocalizedField,
} from "@/lib/products"

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://drvenija.example"
}

export function getAbsoluteUrl(path: string) {
  return new URL(path, getBaseUrl()).toString()
}

export function createAlternates(path: string) {
  const normalizedPath = path === "/" ? "" : path
  return {
    canonical: getAbsoluteUrl(path || "/"),
    languages: {
      bs: getAbsoluteUrl(path || "/"),
      en: getAbsoluteUrl(buildPath("en", normalizedPath)),
      "x-default": getAbsoluteUrl(path || "/"),
    },
  }
}

export function createMetadata(args: {
  locale?: Locale
  path: string
  title: string | LocalizedField
  description?: string | LocalizedField
}): Metadata {
  const locale = args.locale ?? defaultLocale
  const title = typeof args.title === "string" ? args.title : getLocalizedField(args.title, locale)
  const description =
    typeof args.description === "string"
      ? args.description
      : getLocalizedField(args.description ?? siteDescription, locale)
  const canonicalPath = locale === "en" ? buildPath("en", args.path === "/" ? "" : args.path) : args.path

  return {
    title,
    description,
    alternates: {
      ...createAlternates(args.path),
      canonical: getAbsoluteUrl(canonicalPath || "/"),
    },
    openGraph: {
      title,
      description,
      url: getAbsoluteUrl(canonicalPath || "/"),
      siteName,
      locale: locale === "bs" ? "bs_BA" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}
