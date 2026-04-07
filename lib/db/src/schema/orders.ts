import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { productTypesTable } from "./productTypes";
import { supplySourcesTable } from "./supplySources";
import { productsTable } from "./products";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customersTable.id).notNull(),
  closedAt: timestamp("closed_at"),
  orderCode: text("order_code"),
  productTypeId: integer("product_type_id").references(() => productTypesTable.id),
  supplySourceId: integer("supply_source_id").references(() => supplySourcesTable.id),
  productId: integer("product_id").references(() => productsTable.id),
  customProductName: text("custom_product_name"),
  quantity: integer("quantity").notNull().default(1),
  sellPrice: integer("sell_price").notNull().default(0),
  costPrice: integer("cost_price").notNull().default(0),
  revenue: integer("revenue").notNull().default(0),
  profit: integer("profit").notNull().default(0),
  warrantyMonths: integer("warranty_months"),
  warrantySourceMonths: integer("warranty_source_months"),
  warrantyCode: text("warranty_code"),
  warrantyExpiry: timestamp("warranty_expiry"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
