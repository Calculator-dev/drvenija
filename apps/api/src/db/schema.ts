import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  uniqueIndex,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const localeEnum = pgEnum("locale", ["bs", "en"]);
export const materialEnum = pgEnum("material", [
  "plexiglass",
  "mediapan",
  "mixed",
]);
export const productTypeEnum = pgEnum("product_type", ["standard", "custom"]);
export const orderStatusEnum = pgEnum("order_status", [
  "submitted",
  "confirmed",
  "declined",
  "in_production",
  "packed",
  "shipped",
  "completed",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending_manual",
  "paid",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "cash_on_delivery",
]);
export const discountKindEnum = pgEnum("discount_kind", ["percent", "fixed"]);
/**
 * gallery: product gallery. room: no longer used (room photos were replaced by cutouts).
 * cutout: the product on a transparent background, placed on the showroom wall.
 * showroom: the showroom room photo (not linked to a product).
 * calligraphy: a levha text's calligraphy on a transparent background (not linked to a product).
 */
export const mediaKindEnum = pgEnum("media_kind", ["gallery", "room", "cutout", "showroom", "calligraphy"]);
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
]);

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 80 }).notNull().unique(),
  translations: jsonb("translations")
    .$type<
      Record<string, { name: string; slug: string; description: string }>
    >()
    .notNull(),
  seo: jsonb("seo")
    .$type<Record<string, { title: string; description: string }>>()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  sku: varchar("sku", { length: 80 }).notNull().unique(),
  type: productTypeEnum("type").notNull(),
  material: materialEnum("material").notNull(),
  featured: boolean("featured").notNull().default(false),
  customizable: boolean("customizable").notNull().default(false),
  // Unpublished products stay in the CRM but are hidden from the storefront and cannot be ordered.
  published: boolean("published").notNull().default(true),
  price: integer("price").notNull(),
  dimensions: text("dimensions").notNull(),
  leadTime: jsonb("lead_time").$type<Record<string, string>>().notNull(),
  stockLabel: jsonb("stock_label").$type<Record<string, string>>().notNull(),
  translations: jsonb("translations")
    .$type<
      Record<
        string,
        {
          slug: string;
          name: string;
          tagline: string;
          shortDescription: string;
          description: string;
        }
      >
    >()
    .notNull(),
  seo: jsonb("seo")
    .$type<Record<string, { title: string; description: string }>>()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 80 }).notNull().unique(),
  dimensions: text("dimensions").notNull(),
  price: integer("price").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  index("product_variants_product_id_idx").on(table.productId),
]).enableRLS();

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id),
  storageKey: text("storage_key").notNull(),
  publicUrl: text("public_url").notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  alt: jsonb("alt").$type<Record<string, string>>().notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  kind: mediaKindEnum("kind").notNull().default("gallery"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  email: varchar("email", { length: 190 }).notNull(),
  phone: varchar("phone", { length: 60 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: varchar("order_number", { length: 40 }).notNull().unique(),
  locale: localeEnum("locale").notNull(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  status: orderStatusEnum("status").notNull().default("submitted"),
  paymentStatus: paymentStatusEnum("payment_status")
    .notNull()
    .default("pending_manual"),
  shippingAddress: jsonb("shipping_address")
    .$type<{
      address: string;
      city: string;
      postalCode?: string;
      country: string;
    }>()
    .notNull(),
  notes: text("notes"),
  shippingAmount: integer("shipping_amount").notNull().default(0),
  paymentMethod: paymentMethodEnum("payment_method")
    .notNull()
    .default("bank_transfer"),
  giftWrap: boolean("gift_wrap").notNull().default(false),
  giftWrapAmount: integer("gift_wrap_amount").notNull().default(0),
  giftMessage: text("gift_message"),
  discountCode: varchar("discount_code", { length: 40 }),
  discountAmount: integer("discount_amount").notNull().default(0),
  trackingNumber: varchar("tracking_number", { length: 120 }),
  statusEmailSentAt: timestamp("status_email_sent_at", { withTimezone: true }),
  declineReason: text("decline_reason"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewEmailSentAt: timestamp("review_email_sent_at", { withTimezone: true }),
  confirmationEmailSentAt: timestamp("confirmation_email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  personalization: text("personalization"),
}).enableRLS();

export const inquiries = pgTable("inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  email: varchar("email", { length: 190 }).notNull(),
  phone: varchar("phone", { length: 60 }),
  locale: localeEnum("locale").notNull(),
  brief: text("brief").notNull(),
  dimensions: text("dimensions"),
  deadline: text("deadline"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

export const discountCodes = pgTable("discount_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Stored upper-case; customers can type it in any case.
  code: varchar("code", { length: 40 }).notNull().unique(),
  kind: discountKindEnum("kind").notNull(),
  // Percent (1–100) or whole KM, depending on kind.
  value: integer("value").notNull(),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  authorName: varchar("author_name", { length: 80 }).notNull(),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  locale: localeEnum("locale").notNull(),
  status: reviewStatusEnum("status").notNull().default("pending"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  // One review per product per order, so only buyers review and only once.
  uniqueIndex("reviews_order_product_idx").on(table.orderId, table.productId),
  index("reviews_product_status_idx").on(table.productId, table.status),
]).enableRLS();

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 190 }).notNull().unique(),
  locale: localeEnum("locale").notNull(),
  // Used in unsubscribe links.
  token: uuid("token").defaultRandom().notNull().unique(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

export type ShowroomArea = { x: number; y: number; width: number; height: number };
export type ShowroomPoint = [number, number];

/**
 * The single showroom (row id 1): a room photo, the area on its wall where artwork hangs,
 * the outline of the wall (for repainting it) and the real width of that area in cm.
 * Areas and outlines are percentages of the photo's width and height.
 */
export const showroomSettings = pgTable("showroom_settings", {
  id: integer("id").primaryKey().default(1),
  imageId: uuid("image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  artArea: jsonb("art_area").$type<ShowroomArea>().notNull(),
  wallOutline: jsonb("wall_outline").$type<ShowroomPoint[]>().notNull(),
  areaWidthCm: integer("area_width_cm").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  check("showroom_settings_single_row", sql`${table.id} = 1`),
]).enableRLS();

export const levhaContactEnum = pgEnum("levha_contact", ["email", "whatsapp", "viber"]);

export const levhaRequestStatusEnum = pgEnum("levha_request_status", [
  "new",
  "contacted",
  "accepted",
  "declined",
]);

/** Texts (ayahs, dhikr, names) customers can choose for a custom levha. */
export const levhaAyahs = pgTable("levha_ayahs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: jsonb("name").$type<{ bs: string; en: string }>().notNull(),
  arabic: text("arabic").notNull(),
  // Optional translation customers can put under the ayah.
  translation: jsonb("translation").$type<{ bs: string; en: string }>(),
  // Calligraphy on a transparent background; without it the preview sets the Arabic text.
  imageId: uuid("image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

/** Levha prices (single row, id 1). See LevhaPricing in lib/levha.ts. */
export const levhaSettings = pgTable("levha_settings", {
  id: integer("id").primaryKey().default(1),
  pricing: jsonb("pricing").$type<import("../lib/levha.js").LevhaPricing>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  check("levha_settings_single_row", sql`${table.id} = 1`),
]).enableRLS();

/** A customer's custom levha: the chosen options, the price shown to them and their contact details. */
export const levhaRequests = pgTable("levha_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: varchar("number", { length: 40 }).notNull().unique(),
  locale: localeEnum("locale").notNull(),
  configuration: jsonb("configuration").$type<import("../lib/levha.js").LevhaConfiguration>().notNull(),
  // Text name at the time of the request, so renaming or removing a text keeps the request readable.
  ayahName: text("ayah_name"),
  // The text under the ayah as it will be made (translation or the customer's own), if any.
  subtitleText: text("subtitle_text"),
  // Whole KM shown to the customer; null when the shop must first confirm it can be made
  // (a size other than a standard one, or the customer's own text).
  price: integer("price"),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  email: varchar("email", { length: 190 }).notNull(),
  phone: varchar("phone", { length: 60 }),
  // How the customer wants to be contacted.
  contactMethod: levhaContactEnum("contact_method").notNull().default("email"),
  notes: text("notes"),
  status: levhaRequestStatusEnum("status").notNull().default("new"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  index("levha_requests_created_idx").on(table.createdAt),
]).enableRLS();
