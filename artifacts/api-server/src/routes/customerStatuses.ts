import { Router } from "express";
import { db } from "@workspace/db";
import { customerStatusesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/customer-statuses", async (req, res) => {
  const statuses = await db.select().from(customerStatusesTable).orderBy(customerStatusesTable.sortOrder);
  res.json(statuses);
});

router.post("/customer-statuses/reorder", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be an array" });
  for (let i = 0; i < ids.length; i++) {
    await db.update(customerStatusesTable).set({ sortOrder: i }).where(eq(customerStatusesTable.id, ids[i]));
  }
  res.json({ success: true });
});

router.post("/customer-statuses", async (req, res) => {
  const { name, color = "#6b7280", sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  let order = sortOrder;
  if (order === undefined || order === null) {
    const existing = await db.select().from(customerStatusesTable);
    order = existing.length;
  }
  const [status] = await db.insert(customerStatusesTable).values({ name, color, sortOrder: order }).returning();
  res.status(201).json(status);
});

router.put("/customer-statuses/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, color = "#6b7280", sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const updates: Record<string, unknown> = { name, color };
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  const [status] = await db.update(customerStatusesTable).set(updates).where(eq(customerStatusesTable.id, id)).returning();
  if (!status) return res.status(404).json({ error: "Not found" });
  res.json(status);
});

router.delete("/customer-statuses/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(customerStatusesTable).where(eq(customerStatusesTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
