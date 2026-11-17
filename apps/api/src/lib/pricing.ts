import { shippingFor } from "./shipping.js"
import type { discountCodes } from "../db/schema.js"

// Whole KM, like every other amount. The storefront reads it from GET /public/catalogue.
export const giftWrapPrice = 5

type DiscountCode = Pick<typeof discountCodes.$inferSelect, "kind" | "value" | "minSubtotal" | "startsAt" | "endsAt" | "maxUses" | "usedCount" | "active">

export type DiscountProblem = "inactive" | "not_started" | "expired" | "used_up" | "min_subtotal"

/** Why a code cannot be used for this subtotal right now, or null when it can. */
export function discountProblem(code: DiscountCode, subtotal: number, now = new Date()): DiscountProblem | null {
  if (!code.active) return "inactive"
  if (code.startsAt && code.startsAt > now) return "not_started"
  if (code.endsAt && code.endsAt <= now) return "expired"
  if (code.maxUses !== null && code.usedCount >= code.maxUses) return "used_up"
  if (subtotal < code.minSubtotal) return "min_subtotal"
  return null
}

/** Discount in whole KM, rounded down and never more than the subtotal. */
export function discountFor(code: Pick<DiscountCode, "kind" | "value">, subtotal: number) {
  const amount = code.kind === "percent" ? Math.floor(subtotal * code.value / 100) : code.value
  return Math.max(0, Math.min(subtotal, amount))
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

/**
 * Order totals. Free delivery is judged on the products' subtotal after the discount,
 * so a discount cannot push an order over the threshold it did not reach on its own.
 */
export function orderTotals(input: { subtotal: number; discount: number; giftWrap: boolean }) {
  const discounted = input.subtotal - input.discount
  const shippingAmount = shippingFor(discounted)
  const giftWrapAmount = input.giftWrap ? giftWrapPrice : 0
  return { subtotal: input.subtotal, discountAmount: input.discount, shippingAmount, giftWrapAmount, total: discounted + shippingAmount + giftWrapAmount }
}
