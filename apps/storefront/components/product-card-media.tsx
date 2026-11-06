import Image from "next/image"
import { useTranslations } from "next-intl"
import { isSvg, type Locale, type LocalizedProduct } from "@/lib/products"
import { cn } from "@/lib/utils"

/**
 * Product photo for cards: the second image fades in on hover (when there is one),
 * with "Bestseller" and "Personalised" badges in the corner.
 */
export function ProductCardMedia({ locale, product, sizes, priority = false, className }: { locale: Locale; product: LocalizedProduct; sizes: string; priority?: boolean; className?: string }) {
  const t = useTranslations("shop")
  const hoverImage = product.media[1]

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      <Image
        unoptimized={isSvg(product.primaryImage.url)}
        src={product.primaryImage.url}
        alt={product.primaryImage.alt[locale]}
        fill
        priority={priority}
        sizes={sizes}
        placeholder={product.primaryImage.blurDataURL ? "blur" : "empty"}
        blurDataURL={product.primaryImage.blurDataURL}
        className={cn("object-cover transition duration-700 group-hover:scale-[1.03]", hoverImage && "group-hover:opacity-0")}
      />
      {hoverImage && (
        <Image
          unoptimized={isSvg(hoverImage.url)}
          src={hoverImage.url}
          alt=""
          fill
          sizes={sizes}
          className="object-cover opacity-0 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
        />
      )}
      <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
        {product.featured && <span className="bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">{t("bestseller")}</span>}
        {product.customizable && <span className="bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">{t("personalised")}</span>}
      </div>
    </div>
  )
}
