import { dashboardView, inquiryRows, orderRows, productRows, type AdminDashboard, type AdminInquiry, type AdminInquiryDetail, type AdminOrder, type AdminOrderDetail, type AdminProduct, type FulfilmentTarget, type OrderDecisionResult, type OrderStatusResult, type PaymentStatus, type ProductDetails } from "./admin-data"
import { apiUrl as API_URL, supabase } from "./auth"
import type { AdminDiscount, AdminReview, DiscountInput, NewsletterSubscriber, ReviewStatus } from "./marketing"
import type { ShowroomInput, ShowroomSettings } from "./showroom"
import type { AdminLevhaAyah, AdminLevhaRequest, AdminLevhaRequestDetail, LevhaAyahInput, LevhaPricing, LevhaRequestUpdate } from "./levha"

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

async function fetchJson<T>(path: string, options?: { method: "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown }): Promise<T> {
  if (!API_URL || !supabase) throw new Error("Administratorski servis nije konfigurisan")
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new Error("Potrebna je prijava")

  const response = await fetch(`${API_URL}${path}`, {
    method: options?.method ?? "GET",
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
    // The API rejects an empty body declared as JSON, so only bodies get a content type.
    headers: {
      ...(options?.body === undefined ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${data.session.access_token}`,
    },
  })

  if (response.status === 401 || response.status === 403) window.dispatchEvent(new Event("admin-access-denied"))
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const fields = Array.isArray(body?.fields) ? `: ${body.fields.join(", ")}` : ""
    throw new ApiError(`${body?.message ?? "Zahtjev nije uspio"}${fields}`, response.status)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function getDashboard() {
  return fetchJson<AdminDashboard>("/admin/dashboard").then(dashboardView)
}

export function getProducts() {
  return fetchJson<AdminProduct[]>("/admin/products").then(productRows)
}

export function getOrders() {
  return fetchJson<AdminOrder[]>("/admin/orders").then(orderRows)
}

export function getOrder(id: string) {
  return fetchJson<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(id)}`)
}

export function decideOrder(id: string, body: { decision: "accept" } | { decision: "decline"; reason: string }) {
  return fetchJson<OrderDecisionResult>(`/admin/orders/${encodeURIComponent(id)}/decision`, { method: "PUT", body })
}

export function updateOrderStatus(id: string, body: { status: FulfilmentTarget; trackingNumber?: string; notify: boolean }) {
  return fetchJson<OrderStatusResult>(`/admin/orders/${encodeURIComponent(id)}/status`, { method: "PUT", body })
}

export function updateOrderPayment(id: string, paymentStatus: Exclude<PaymentStatus, "cancelled">) {
  return fetchJson<{ order: { id: string; paymentStatus: PaymentStatus } }>(`/admin/orders/${encodeURIComponent(id)}/payment`, { method: "PUT", body: { paymentStatus } })
}

export function getInquiries() {
  return fetchJson<AdminInquiry[]>("/admin/inquiries").then(inquiryRows)
}

export function getInquiry(id: string) {
  return fetchJson<AdminInquiryDetail>(`/admin/inquiries/${encodeURIComponent(id)}`)
}

export type AdminCategory = { id: string; translations: Record<string, { name: string }> }
export function getCategories() {
  return fetchJson<AdminCategory[]>("/admin/categories")
}
export function createProduct(body: unknown) {
  return fetchJson<AdminProduct>("/admin/products", { method: "POST", body })
}

export function getProduct(id: string) {
  return fetchJson<ProductDetails>(`/admin/products/${encodeURIComponent(id)}`)
}
export function updateProduct(id: string, body: unknown) {
  return fetchJson<ProductDetails>(`/admin/products/${encodeURIComponent(id)}`, { method: "PUT", body })
}

export function setProductPublished(id: string, published: boolean) {
  return fetchJson<{ id: string; published: boolean }>(`/admin/products/${encodeURIComponent(id)}/published`, { method: "PATCH", body: { published } })
}

export function getDiscounts() {
  return fetchJson<AdminDiscount[]>("/admin/discounts")
}
export function saveDiscount(id: string | undefined, body: DiscountInput) {
  return id
    ? fetchJson<AdminDiscount>(`/admin/discounts/${encodeURIComponent(id)}`, { method: "PUT", body })
    : fetchJson<AdminDiscount>("/admin/discounts", { method: "POST", body })
}
export function deleteDiscount(id: string) {
  return fetchJson<void>(`/admin/discounts/${encodeURIComponent(id)}`, { method: "DELETE" })
}

export function getReviews() {
  return fetchJson<AdminReview[]>("/admin/reviews")
}
export function updateReview(id: string, status: ReviewStatus) {
  return fetchJson<AdminReview>(`/admin/reviews/${encodeURIComponent(id)}`, { method: "PUT", body: { status } })
}

export function getNewsletterSubscribers() {
  return fetchJson<NewsletterSubscriber[]>("/admin/newsletter")
}

/** null until the showroom is saved for the first time. */
export function getShowroom() {
  return fetchJson<ShowroomSettings | null>("/admin/showroom")
}
export function saveShowroom(body: ShowroomInput) {
  return fetchJson<{ ok: true }>("/admin/showroom", { method: "PUT", body })
}

export function getLevhaPricing() {
  return fetchJson<{ pricing: LevhaPricing }>("/admin/levha/settings").then(result => result.pricing)
}
export function saveLevhaPricing(body: LevhaPricing) {
  return fetchJson<{ pricing: LevhaPricing }>("/admin/levha/settings", { method: "PUT", body }).then(result => result.pricing)
}

export function getLevhaAyahs() {
  return fetchJson<AdminLevhaAyah[]>("/admin/levha/ayahs")
}
/** The response has no `image`; the list is reloaded after saving. */
export function saveLevhaAyah(id: string | undefined, body: LevhaAyahInput) {
  return id
    ? fetchJson<Omit<AdminLevhaAyah, "image">>(`/admin/levha/ayahs/${encodeURIComponent(id)}`, { method: "PUT", body })
    : fetchJson<Omit<AdminLevhaAyah, "image">>("/admin/levha/ayahs", { method: "POST", body })
}

export function getLevhaRequests() {
  return fetchJson<AdminLevhaRequest[]>("/admin/levha/requests")
}
export function getLevhaRequest(id: string) {
  return fetchJson<AdminLevhaRequestDetail>(`/admin/levha/requests/${encodeURIComponent(id)}`)
}
export function updateLevhaRequest(id: string, body: LevhaRequestUpdate) {
  return fetchJson<AdminLevhaRequestDetail>(`/admin/levha/requests/${encodeURIComponent(id)}`, { method: "PUT", body })
}

export async function uploadProductImage(file: File): Promise<import("./admin-data").ProductImage> {
  if (!API_URL || !supabase) throw new Error("Administratorski servis nije konfigurisan")
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new Error("Potrebna je prijava")
  const response = await fetch(`${API_URL}/admin/media`, {
    method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": file.type }, body: file,
  })
  if (response.status === 401 || response.status === 403) window.dispatchEvent(new Event("admin-access-denied"))
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message ?? "Učitavanje slike nije uspjelo. Pokušajte ponovo.")
  }
  return response.json()
}
