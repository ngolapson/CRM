import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customerSourcesTable = pgTable("customer_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
});

export const insertCustomerSourceSchema = createInsertSchema(customerSourcesTable).omit({ id: true });
export type InsertCustomerSource = z.infer<typeof insertCustomerSourceSchema>;
export type CustomerSource = typeof customerSourcesTable.$inferSelect;
