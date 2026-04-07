import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const supplySourcesTable = pgTable("supply_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  inventoryValue: integer("inventory_value").notNull().default(0),
});

export const insertSupplySourceSchema = createInsertSchema(supplySourcesTable).omit({ id: true });
export type InsertSupplySource = z.infer<typeof insertSupplySourceSchema>;
export type SupplySource = typeof supplySourcesTable.$inferSelect;
