import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productTypesTable } from "./productTypes";
import { supplySourcesTable } from "./supplySources";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productTypeId: integer("product_type_id").references(() => productTypesTable.id),
  supplySourceId: integer("supply_source_id").references(() => supplySourcesTable.id),
  quantity: integer("quantity").notNull().default(0),
  costPrice: integer("cost_price").notNull().default(0),
  sellPrice: integer("sell_price").notNull().default(0),
  warrantyMonths: integer("warranty_months"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
