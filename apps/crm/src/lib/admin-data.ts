import { formatDate, formatMoney } from "./format";

export type PaymentStatus = "pending_manual" | "paid" | "cancelled";
export type PaymentMethod = "bank_transfer" | "cash_on_delivery";

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  status: string;
  /** Older responses (and fixtures) may omit payment fields. */
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  amount: number;
  createdAt: string;
};
export type AdminDashboard = {
  totals: {
    ordersToday: number;
    awaitingReview: number;
    productionQueued: number;
    inquiriesLast30Days: number;
    productsActive: number;
    reviewsPending: number;
  };
  recentOrders: AdminOrder[];
};
export type AdminProduct = {
  id?: string;
  sku: string;
  type: string;
  price: number;
  /** Visible on the webshop; defaults to true. */
  published?: boolean;
  translations: Record<string, { name: string }>;
  /** Link to the main photo, or null when the product has none. */
  thumbnailUrl?: string | null;
};
const productType = (type: string) =>
  type === "custom"
    ? "Personalizirani"
    : type === "standard"
      ? "Standardni"
      : type;
const orderStatuses: Record<string, string> = {
  submitted: "Zaprimljena",
  confirmed: "Prihvaćena",
  declined: "Odbijena",
  processing: "U obradi",
  production: "U proizvodnji",
  in_production: "U izradi",
  packed: "Spakovana",
  shipped: "Poslana",
  completed: "Završena",
  cancelled: "Otkazana",
};
const orderStatus = (status: string) =>
  orderStatuses[status.toLowerCase()] ?? status;
const paymentStatuses: Record<PaymentStatus, string> = {
  pending_manual: "Čeka uplatu",
  paid: "Plaćeno",
  cancelled: "Otkazano",
};
const paymentMethods: Record<PaymentMethod, string> = {
  bank_transfer: "Uplata na račun",
  cash_on_delivery: "Plaćanje pouzećem",
};
export const paymentStatusLabel = (status: string) =>
  paymentStatuses[status as PaymentStatus] ?? status;
export const paymentMethodLabel = (method: string) =>
  paymentMethods[method as PaymentMethod] ?? method;

export function orderRows(orders: AdminOrder[]) {
  return orders.map((order) => ({
    ...order,
    status: orderStatus(order.status),
    paymentStatus: order.paymentStatus ?? "",
    payment: order.paymentStatus ? paymentStatusLabel(order.paymentStatus) : "—",
    paymentMethod: order.paymentMethod ? paymentMethodLabel(order.paymentMethod) : "",
    amount: formatMoney(order.amount),
    createdAt: formatDate(order.createdAt),
  }));
}
export const localizedOrderStatus = orderStatus;

/** Fulfilment steps after acceptance, in order. Orders only move forward (steps may be skipped). */
export const fulfilmentSteps = [
  { status: "confirmed", label: "Prihvaćena" },
  { status: "in_production", label: "U izradi" },
  { status: "packed", label: "Spakovano" },
  { status: "shipped", label: "Poslano" },
  { status: "completed", label: "Završeno" },
] as const;
export type FulfilmentTarget = Exclude<(typeof fulfilmentSteps)[number]["status"], "confirmed">;

/** Index of the order's status in the fulfilment steps, or -1 when it was not accepted. */
export const fulfilmentIndex = (status: string) =>
  fulfilmentSteps.findIndex((step) => step.status === status);

/** The statuses an accepted order can move to next; empty for unaccepted or completed orders. */
export function nextFulfilmentSteps(status: string) {
  const index = fulfilmentIndex(status);
  if (index < 0) return [];
  return fulfilmentSteps
    .slice(index + 1)
    .filter((step): step is Extract<(typeof fulfilmentSteps)[number], { status: FulfilmentTarget }> => step.status !== "confirmed");
}
export function dashboardView(data: AdminDashboard) {
  return {
    totals: [
      { label: "Današnje narudžbe", value: String(data.totals.ordersToday) },
      { label: "Čeka pregled", value: String(data.totals.awaitingReview) },
      {
        label: "U izradi, nije poslano",
        value: String(data.totals.productionQueued),
      },
      { label: "Upiti (30 dana)", value: String(data.totals.inquiriesLast30Days) },
      { label: "Proizvodi u katalogu", value: String(data.totals.productsActive) },
      {
        label: "Recenzije na čekanju",
        value: String(data.totals.reviewsPending ?? 0),
        href: "/reviews",
      },
    ] as Array<{ label: string; value: string; href?: string }>,
    recentOrders: orderRows(data.recentOrders),
  };
}
export function productRows(products: AdminProduct[]) {
  return products.map((product) => ({
    id: product.id ?? "",
    sku: product.sku,
    name:
      product.translations.bs?.name ??
      product.translations.en?.name ??
      product.sku,
    type: productType(product.type),
    price: formatMoney(product.price),
    published: product.published ?? true,
    thumbnailUrl: product.thumbnailUrl ?? null,
  }));
}

export type ProductDetails = AdminProduct & {
  media?: ProductImage[];
  /** Photo of the product in a real room, for the storefront's "Na vašem zidu" section. */
  roomImage?: RoomImage | null;
  id: string;
  categoryId: string;
  material: string;
  dimensions: string;
  featured: boolean;
  customizable: boolean;
  leadTime: Record<string, string>;
  stockLabel: Record<string, string>;
  variants?: ProductVariant[];
  translations: Record<
    string,
    {
      name: string;
      tagline: string;
      shortDescription: string;
      description: string;
      slug: string;
    }
  >;
};

export type ProductVariant = {
  id: string;
  sku: string;
  dimensions: string;
  price: number;
  active?: boolean;
  isDefault?: boolean;
};

export type ProductImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: { bs: string; en: string };
  isPrimary: boolean;
};

export type RoomImage = Omit<ProductImage, "isPrimary">;

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  locale: "bs" | "en";
  status: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  giftWrap: boolean;
  giftWrapAmount: number;
  giftMessage: string | null;
  discountCode: string | null;
  discountAmount: number;
  trackingNumber: string | null;
  statusEmailSentAt: string | null;
  updatedAt: string;
  customer: { fullName: string; email: string; phone: string | null };
  shippingAddress: {
    address: string;
    city: string;
    postalCode?: string;
    country: string;
  };
  notes: string | null;
  declineReason: string | null;
  reviewedAt: string | null;
  reviewEmailSentAt: string | null;
  confirmationEmailSentAt: string | null;
  createdAt: string;
  subtotal: number;
  shippingAmount: number;
  amount: number;
  items: Array<{
    id: string;
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    personalization: string | null;
  }>;
};

export type OrderDecisionResult = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    declineReason: string | null;
    reviewedAt: string | null;
    reviewEmailSentAt: string | null;
  };
  notification: EmailResult;
};

export type EmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "delivery_failed" };

export type OrderStatusResult = {
  order: { id: string; status: string; trackingNumber: string | null; statusEmailSentAt: string | null };
  notification: EmailResult | null;
};

export type AdminInquiry = {
  id: string;
  fullName: string;
  email: string;
  brief: string;
  deadline: string | null;
  createdAt: string;
};
export type AdminInquiryDetail = AdminInquiry & {
  locale: "bs" | "en";
  phone: string | null;
  dimensions: string | null;
};
export function inquiryRows(inquiries: AdminInquiry[]) {
  return inquiries.map((inquiry) => ({
    id: inquiry.id,
    fullName: inquiry.fullName,
    email: inquiry.email,
    brief: inquiry.brief.length > 90 ? `${inquiry.brief.slice(0, 90).trimEnd()}…` : inquiry.brief,
    deadline: inquiry.deadline ?? "—",
    createdAt: formatDate(inquiry.createdAt),
  }));
}

/** Feedback after a status change, including whether the customer email went out. */
export function statusEmailMessage(notification: EmailResult | null) {
  if (!notification) return "Status je ažuriran. Kupcu nije poslan email."
  if (notification.sent) return "Status je ažuriran i kupcu je poslan email."
  return notification.reason === "not_configured"
    ? "Status je ažuriran, ali email servis još nije konfigurisan."
    : "Status je ažuriran, ali email nije isporučen. Pokušajte kontaktirati kupca direktno."
}
