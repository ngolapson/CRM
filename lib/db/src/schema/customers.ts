import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customerStatusesTable } from "./customerStatuses";
import { employeesTable } from "./employees";
import { customerSourcesTable } from "./customerSources";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  code: text("code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  note: text("note"),
  statusId: integer("status_id").references(() => customerStatusesTable.id).notNull(),
  employeeId: integer("employee_id").references(() => employeesTable.id).notNull(),
  sourceId: integer("source_id").references(() => customerSourcesTable.id),
  lastContactAt: timestamp("last_contact_at"),
  nextContactAt: timestamp("next_contact_at"),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ id: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
