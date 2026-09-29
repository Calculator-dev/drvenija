import { CartCatalogueSync } from "@/components/cart-catalogue-sync"
import { CheckoutClient } from "@/components/checkout-client"
import { PageIntro } from "@/components/page-intro"
import { type Locale } from "@/lib/products"

export function CheckoutPage({ locale }: { locale: Locale }) {
  return (
    <>
      <PageIntro
        eyebrow={locale === "bs" ? "Checkout" : "Checkout"}
        title={locale === "bs" ? "Pošaljite narudžbu, a detalje potvrđujemo ručno." : "Submit the order and we will confirm the details manually."}
        description={
          locale === "bs"
            ? "Ovo je prva verzija webshop checkouta. Nakon slanja narudžbe dobijate potvrdu, detalje dostave i upute za manualno plaćanje."
            : "This is the first webshop checkout release. After submitting, you receive confirmation, shipping details, and manual payment instructions."
        }
      />
      <CartCatalogueSync locale={locale} />
      <CheckoutClient locale={locale} />
    </>
  )
}
