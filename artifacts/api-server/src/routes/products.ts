import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, productTypesTable, supplySourcesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/products", async (_req, res) => {
  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      productTypeId: productsTable.productTypeId,
      productTypeName: productTypesTable.name,
      supplySourceId: productsTable.supplySourceId,
      supplySourceName: supplySourcesTable.name,
      quantity: productsTable.quantity,
      costPrice: productsTable.costPrice,
      sellPrice: productsTable.sellPrice,
      warrantyMonths: productsTable.warrantyMonths,
      note: productsTable.note,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(productTypesTable, eq(productsTable.productTypeId, productTypesTable.id))
    .leftJoin(supplySourcesTable, eq(productsTable.supplySourceId, supplySourcesTable.id))
    .orderBy(productsTable.id);

  res.json(products.map(p => ({
    ...p,
    createdAt: p.createdAt?.toISOString(),
  })));
});

router.post("/products", async (req, res) => {
  const { name, productTypeId = null, supplySourceId = null, quantity = 0, costPrice = 0, sellPrice = 0, warrantyMonths = null, note = null } = req.body as {
    name?: string; productTypeId?: number | null; supplySourceId?: number | null;
    quantity?: number; costPrice?: number; sellPrice?: number; warrantyMonths?: number | null; note?: string | null;
  };
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [product] = await db.insert(productsTable).values({ name, productTypeId, supplySourceId, quantity, costPrice, sellPrice, warrantyMonths, note }).returning();
  res.status(201).json({ ...product, createdAt: product.createdAt?.toISOString() });
});

router.put("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, productTypeId = null, supplySourceId = null, quantity = 0, costPrice = 0, sellPrice = 0, warrantyMonths = null, note = null } = req.body as {
    name?: string; productTypeId?: number | null; supplySourceId?: number | null;
    quantity?: number; costPrice?: number; sellPrice?: number; warrantyMonths?: number | null; note?: string | null;
  };
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [product] = await db.update(productsTable).set({ name, productTypeId, supplySourceId, quantity, costPrice, sellPrice, warrantyMonths, note }).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...product, createdAt: product.createdAt?.toISOString() });
});

router.delete("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
