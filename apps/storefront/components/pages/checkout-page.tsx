import { getTranslations } from "next-intl/server"
import { CartCatalogueSync } from "@/components/cart-catalogue-sync"
import { CheckoutClient } from "@/components/checkout-client"
import { PageIntro } from "@/components/page-intro"
import { getCatalogue } from "@/lib/catalogue"
import { defaultCheckoutSettings, type Locale } from "@/lib/products"

export async function CheckoutPage({ locale }: { locale: Locale }) {
  const t = await getTranslations("checkout")
  // Checkout stays usable if the catalogue is briefly unavailable; the API prices the order.
  const settings = await getCatalogue().then(catalogue => catalogue.checkout, () => defaultCheckoutSettings)
  return (
    <>
      <PageIntro
        eyebrow={t("intro.eyebrow")}
        title={t("intro.title")}
        description={t("intro.description")}
      />
      <CartCatalogueSync />
      <CheckoutClient locale={locale} settings={settings} />
    </>
  )
}
