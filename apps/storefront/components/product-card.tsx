import Link from "next/link"
import { useTranslations } from "next-intl"
import { ProductCardMedia } from "@/components/product-card-media"
import { buildPath, displayPrice, formatPrice, type Locale, type LocalizedProduct } from "@/lib/products"

export function ProductCard({
  locale,
  product,
  priority = false,
}: {
  locale: Locale
  product: LocalizedProduct
  priority?: boolean
}) {
  const href = `${buildPath(locale, "/product")}/${product.localizedSlug}`
  const price = displayPrice(product)
  const t = useTranslations("product")
  const common = useTranslations("common")

  return (
    <Link href={href} className="group flex h-full flex-col">
      <ProductCardMedia locale={locale} product={product} priority={priority} sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw" className="aspect-4/5 rounded-sm" />
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {product.categoryName?.[locale] ?? ""} · {common(`materials.${product.material}`)}
        </p>
        <h3 className="mt-2 font-serif text-lg leading-snug text-foreground transition-opacity group-hover:opacity-70 md:text-xl">{product.localizedName}</h3>
        <p className="mt-1 hidden text-sm leading-6 text-muted-foreground line-clamp-2 sm:block">{product.localizedShortDescription}</p>
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-3">
          <p className="font-semibold text-foreground">
            {price.from ? common("from", { price: formatPrice(price.amount, locale) }) : formatPrice(price.amount, locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            {product.type === "custom" ? t("personalizationAvailable") : t("readyToOrder")}
          </p>
        </div>
      </div>
    </Link>
  )
}
