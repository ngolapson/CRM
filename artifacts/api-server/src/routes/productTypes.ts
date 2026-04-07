import { Router } from "express";
import { db } from "@workspace/db";
import { productTypesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/product-types", async (_req, res) => {
  const types = await db.select().from(productTypesTable).orderBy(productTypesTable.id);
  res.json(types);
});

router.post("/product-types", async (req, res) => {
  const { name, slug = null } = req.body as { name?: string; slug?: string | null };
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [type] = await db.insert(productTypesTable).values({ name, slug }).returning();
  res.status(201).json(type);
});

router.put("/product-types/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, slug = null } = req.body as { name?: string; slug?: string | null };
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [type] = await db.update(productTypesTable).set({ name, slug }).where(eq(productTypesTable.id, id)).returning();
  if (!type) { res.status(404).json({ error: "Not found" }); return; }
  res.json(type);
});

router.delete("/product-types/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(productTypesTable).where(eq(productTypesTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
