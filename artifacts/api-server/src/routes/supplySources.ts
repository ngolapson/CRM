import { Router } from "express";
import { db } from "@workspace/db";
import { supplySourcesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/supply-sources", async (_req, res) => {
  const sources = await db.select().from(supplySourcesTable).orderBy(supplySourcesTable.id);
  res.json(sources.map(s => ({
    id: s.id,
    name: s.name,
    inventoryValue: s.inventoryValue,
    phone: s.phone ?? null,
    email: s.email ?? null,
    note: s.note ?? null,
  })));
});

router.post("/supply-sources", async (req, res) => {
  const { name, inventoryValue = 0, phone = null, email = null, note = null } = req.body as {
    name?: string; inventoryValue?: number; phone?: string | null; email?: string | null; note?: string | null;
  };
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [source] = await db.insert(supplySourcesTable).values({ name, inventoryValue, phone, email, note }).returning();
  res.status(201).json({ ...source, phone: source.phone ?? null, email: source.email ?? null, note: source.note ?? null });
});

router.put("/supply-sources/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, inventoryValue = 0, phone = null, email = null, note = null } = req.body as {
    name?: string; inventoryValue?: number; phone?: string | null; email?: string | null; note?: string | null;
  };
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [source] = await db.update(supplySourcesTable).set({ name, inventoryValue, phone, email, note }).where(eq(supplySourcesTable.id, id)).returning();
  if (!source) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...source, phone: source.phone ?? null, email: source.email ?? null, note: source.note ?? null });
});

router.delete("/supply-sources/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(supplySourcesTable).where(eq(supplySourcesTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
