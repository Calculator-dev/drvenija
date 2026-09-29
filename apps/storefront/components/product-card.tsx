import Image from "next/image"
import Link from "next/link"
import { buildPath, formatPrice, type Locale, type LocalizedProduct } from "@/lib/products"

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

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-muted">
        <Image
          unoptimized
          src={product.primaryImage.url}
          alt={product.primaryImage.alt[locale]}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 100vw"
          placeholder={product.primaryImage.blurDataURL ? "blur" : "empty"}
          blurDataURL={product.primaryImage.blurDataURL}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {product.categoryName?.[locale] ?? ""} · {product.material}
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl leading-tight text-foreground">{product.localizedName}</h3>
            <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">{product.localizedShortDescription}</p>
          </div>
          <p className="font-medium text-foreground">
            {formatPrice(product.priceFrom ?? product.price, locale)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {product.type === "custom"
            ? locale === "bs"
              ? "Personalizacija dostupna"
              : "Personalization available"
            : locale === "bs"
              ? "Spremno za narudžbu"
              : "Ready to order"}
        </p>
      </div>
    </Link>
  )
}
