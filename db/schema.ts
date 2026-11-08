import { pgTable, serial, text, integer, date, time, timestamp, index } from "drizzle-orm/pg-core";

// One row per customer order. Hair bookings and bakery orders share this table,
// distinguished by `type`.
export const orders = pgTable(
  "orders",
  {
    id: serial().primaryKey(),
    type: text().notNull(), // "hair" | "bakery"
    customerName: text("customer_name").notNull(),
    phone: text().notNull(),
    item: text().notNull(),
    unitPrice: integer("unit_price").notNull(), // in Rand
    quantity: integer().notNull().default(1),
    total: integer().notNull(), // in Rand
    date: date().notNull(), // appointment date or date needed
    time: time(), // hair bookings only
    fulfilment: text(), // "Collection" | "Delivery" (bakery only)
    address: text(),
    notes: text(),
    status: text().notNull().default("new"), // new | confirmed | completed | cancelled
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_created_at_idx").on(t.createdAt), index("orders_status_idx").on(t.status)],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
