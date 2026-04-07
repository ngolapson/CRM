import { pgTable, serial, integer, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const stockReceiptsTable = pgTable("stock_receipts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  quantity: integer("quantity").notNull(),
  importDate: date("import_date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStockReceiptSchema = createInsertSchema(stockReceiptsTable).omit({ id: true, createdAt: true });
export type InsertStockReceipt = z.infer<typeof insertStockReceiptSchema>;
export type StockReceipt = typeof stockReceiptsTable.$inferSelect;
