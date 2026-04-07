import { Router } from "express";
import { db } from "@workspace/db";
import { customerSourcesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/customer-sources", async (_req, res) => {
  const sources = await db.select().from(customerSourcesTable).orderBy(customerSourcesTable.id);
  res.json(sources);
});

router.post("/customer-sources", async (req, res) => {
  const { name, description = null, icon = null } = req.body as { name?: string; description?: string | null; icon?: string | null };
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [source] = await db.insert(customerSourcesTable).values({ name, description, icon }).returning();
  res.status(201).json(source);
});

router.put("/customer-sources/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, description = null, icon = null } = req.body as { name?: string; description?: string | null; icon?: string | null };
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [source] = await db.update(customerSourcesTable).set({ name, description, icon }).where(eq(customerSourcesTable.id, id)).returning();
  if (!source) { res.status(404).json({ error: "Not found" }); return; }
  res.json(source);
});

router.delete("/customer-sources/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(customerSourcesTable).where(eq(customerSourcesTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
