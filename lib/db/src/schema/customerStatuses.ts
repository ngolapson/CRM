import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customerStatusesTable = pgTable("customer_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6b7280"),
  sortOrder: integer("sort_order").notNull().default(0),
  isSystem: boolean("is_system").notNull().default(false),
});

export const insertCustomerStatusSchema = createInsertSchema(customerStatusesTable).omit({ id: true });
export type InsertCustomerStatus = z.infer<typeof insertCustomerStatusSchema>;
export type CustomerStatus = typeof customerStatusesTable.$inferSelect;
