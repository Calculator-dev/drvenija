import { CartRepricer } from "@/components/cart-repricer"
import { getCartOffers } from "@/lib/catalogue"
import type { Locale } from "@/lib/products"

/** Brings the stored cart in line with live prices and availability. */
export async function CartCatalogueSync({ locale }: { locale: Locale }) {
  try {
    const { offers, shipping } = await getCartOffers()
    return <CartRepricer locale={locale} offers={offers} shipping={shipping} />
  } catch {
    // The cart stays usable; the API validates every order anyway.
    return null
  }
}
