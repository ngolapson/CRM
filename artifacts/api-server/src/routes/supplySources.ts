import { Router } from "express";
import { db } from "@workspace/db";
import { supplySourcesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/supply-sources", async (req, res) => {
  const sources = await db.select().from(supplySourcesTable).orderBy(supplySourcesTable.id);
  res.json(sources);
});

router.post("/supply-sources", async (req, res) => {
  const { name, inventoryValue = 0 } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const [source] = await db.insert(supplySourcesTable).values({ name, inventoryValue }).returning();
  res.status(201).json(source);
});

router.put("/supply-sources/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, inventoryValue = 0 } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const [source] = await db.update(supplySourcesTable).set({ name, inventoryValue }).where(eq(supplySourcesTable.id, id)).returning();
  if (!source) return res.status(404).json({ error: "Not found" });
  res.json(source);
});

router.delete("/supply-sources/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(supplySourcesTable).where(eq(supplySourcesTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
