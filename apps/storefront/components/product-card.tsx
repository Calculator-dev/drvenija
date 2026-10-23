import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { buildPath, displayPrice, formatPrice, type Locale, type LocalizedProduct, isSvg } from "@/lib/products"

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
    <Link href={href} className="group flex flex-col gap-3.5">
      <div className="relative aspect-[4/4.8] overflow-hidden rounded-md bg-muted">
        <Image
          unoptimized={isSvg(product.primaryImage.url)}
          src={product.primaryImage.url}
          alt={product.primaryImage.alt[locale]}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          placeholder={product.primaryImage.blurDataURL ? "blur" : "empty"}
          blurDataURL={product.primaryImage.blurDataURL}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {product.type === "custom" && (
          <span className="absolute left-3 top-3 rounded-full bg-night px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-gold sm:text-[11px]">
            {t("personalizationAvailable")}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6458] sm:text-xs">
          {[product.categoryName?.[locale], common(`materials.${product.material}`)].filter(Boolean).join(" · ")}
        </p>
        <h3 className="font-serif text-lg leading-tight text-foreground transition-colors group-hover:text-gold-deep sm:text-[19px]">{product.localizedName}</h3>
        <p className="text-[15px] font-semibold text-foreground">
          {price.from ? common("from", { price: formatPrice(price.amount, locale) }) : formatPrice(price.amount, locale)}
        </p>
      </div>
    </Link>
  )
}
