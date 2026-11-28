import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

/* -------------------------------------------------------------------------- */
/* Better Auth tables                                                         */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* -------------------------------------------------------------------------- */
/* Spend Sense                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A Space groups purchases around one life project, e.g. "New Home".
 * Every row below is scoped to a space, and every space to an owner, so a
 * multi-user (SaaS) future does not need a data migration.
 */
export const spaces = pgTable(
  "spaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    /** ISO 4217. EGP only in M1, stored per space for later. */
    currency: text("currency").notNull().default("EGP"),
    /** Index into the design palette's chip colours. */
    color: integer("color").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("spaces_owner_idx").on(t.ownerId)],
);

/** What kind of thing it is: Flooring, Kitchen appliances, Ceramics… */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: integer("color").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("categories_space_idx").on(t.spaceId)],
);

/** Where it goes: Kitchen, Master bath, Living room… */
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("rooms_space_idx").on(t.spaceId)],
);

/** Shops and suppliers. Owned by the user so they are shared across spaces. */
export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("vendors_owner_idx").on(t.ownerId)],
);

/**
 * Money is stored as integer minor units (piastres for EGP) to avoid
 * floating-point drift. `totalPaid` is the source of truth for sums.
 */
export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Who made it (Bosch), as opposed to the vendor: the store it was bought from. */
    brand: text("brand"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
    vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
    purchasedOn: date("purchased_on", { mode: "string" })
      .notNull()
      .default(sql`CURRENT_DATE`),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull().default("1"),
    /** Free text such as m², pcs, box. */
    unit: text("unit"),
    unitPrice: bigint("unit_price", { mode: "number" }),
    totalPaid: bigint("total_paid", { mode: "number" }).notNull(),
    /** Total before discount; null when there was no discount. */
    originalTotal: bigint("original_total", { mode: "number" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("purchases_space_date_idx").on(t.spaceId, t.purchasedOn),
    index("purchases_category_idx").on(t.categoryId),
    index("purchases_room_idx").on(t.roomId),
    index("purchases_vendor_idx").on(t.vendorId),
  ],
);

export const attachmentKind = pgEnum("attachment_kind", ["photo", "receipt"]);

/** Product photos and receipts/invoices. Files live in storage, keyed here. */
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    purchaseId: uuid("purchase_id")
      .notNull()
      .references(() => purchases.id, { onDelete: "cascade" }),
    kind: attachmentKind("kind").notNull(),
    storageKey: text("storage_key").notNull(),
    thumbKey: text("thumb_key"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    originalName: text("original_name"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("attachments_purchase_idx").on(t.purchaseId)],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const spacesRelations = relations(spaces, ({ many, one }) => ({
  owner: one(user, { fields: [spaces.ownerId], references: [user.id] }),
  categories: many(categories),
  rooms: many(rooms),
  purchases: many(purchases),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  space: one(spaces, { fields: [categories.spaceId], references: [spaces.id] }),
  purchases: many(purchases),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  space: one(spaces, { fields: [rooms.spaceId], references: [spaces.id] }),
  purchases: many(purchases),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  purchases: many(purchases),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  space: one(spaces, { fields: [purchases.spaceId], references: [spaces.id] }),
  category: one(categories, { fields: [purchases.categoryId], references: [categories.id] }),
  room: one(rooms, { fields: [purchases.roomId], references: [rooms.id] }),
  vendor: one(vendors, { fields: [purchases.vendorId], references: [vendors.id] }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  purchase: one(purchases, { fields: [attachments.purchaseId], references: [purchases.id] }),
}));

export type Space = typeof spaces.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
