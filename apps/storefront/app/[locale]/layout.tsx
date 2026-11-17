import type { Metadata, Viewport } from "next";
import { Amiri, Great_Vibes, Marcellus, Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { SiteShell } from "@/components/site-shell";
import { Toaster } from "@/components/ui/sonner";
import {
  generateLocaleParams,
  resolveLocale,
  type LocaleParams,
} from "@/lib/locale-params";
import { getBaseUrl } from "@/lib/seo";
import "../globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-montserrat",
  display: "swap",
});

const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-marcellus",
  display: "swap",
});

// Only used for short Arabic accents, so it is not preloaded.
const amiri = Amiri({
  weight: "400",
  subsets: ["arabic"],
  variable: "--font-amiri",
  display: "swap",
  preload: false,
});

// Lettering style in the personalisation preview; only needed on product pages.
const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-great-vibes",
  display: "swap",
  preload: false,
});

export const generateStaticParams = generateLocaleParams;

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  icons: {
    icon: [
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#59000a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
  params,
}: Readonly<LocaleParams & { children: React.ReactNode }>) {
  const locale = await resolveLocale(params);
  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} ${marcellus.variable} ${amiri.variable} ${greatVibes.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background font-sans antialiased"
      >
        <NextIntlClientProvider>
          <CartProvider>
            <WishlistProvider>
              <SiteShell locale={locale}>{children}</SiteShell>
              <Toaster position="top-center" />
            </WishlistProvider>
          </CartProvider>
        </NextIntlClientProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
