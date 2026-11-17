import { useTranslations } from "next-intl"
import { StarRating } from "@/components/star-rating"
import type { Locale, LocalizedProduct } from "@/lib/products"

/** Approved reviews from customers who bought the product. Hidden when there are none. */
export function ProductReviews({ locale, product }: { locale: Locale; product: LocalizedProduct }) {
  const t = useTranslations("reviews")
  const reviews = product.reviews ?? []
  if (!product.rating || reviews.length === 0) return null

  return (
    <section id="recenzije" className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-ink">{t("eyebrow")}</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">{t("title")}</h2>
        </div>
        <div className="text-right">
          <p className="font-serif text-4xl">{product.rating.average.toLocaleString(locale === "bs" ? "bs-BA" : "en-GB")}</p>
          <StarRating value={product.rating.average} label={t("average", { rating: product.rating.average, count: product.rating.count })} />
          <p className="mt-1 text-xs text-muted-foreground">{t("count", { count: product.rating.count })}</p>
        </div>
      </div>
      <ul className="mt-2 divide-y divide-border">
        {reviews.map(review => (
          <li key={review.id} className="py-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{review.authorName}</p>
              <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString(locale === "bs" ? "bs-BA" : "en-GB")}</p>
            </div>
            <StarRating value={review.rating} className="mt-1" />
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-foreground/80">{review.body}</p>
            <p className="mt-2 text-xs text-accent-ink">{t("verified")}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
