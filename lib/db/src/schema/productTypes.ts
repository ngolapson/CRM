import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productTypesTable = pgTable("product_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"),
});

export const insertProductTypeSchema = createInsertSchema(productTypesTable).omit({ id: true });
export type InsertProductType = z.infer<typeof insertProductTypeSchema>;
export type ProductType = typeof productTypesTable.$inferSelect;
