import { Router } from "express";
import { db } from "@workspace/db";
import { stockReceiptsTable, productsTable, productTypesTable, supplySourcesTable } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/stock-receipts", async (_req, res) => {
  const receipts = await db
    .select({
      id: stockReceiptsTable.id,
      productId: stockReceiptsTable.productId,
      productName: productsTable.name,
      productTypeName: productTypesTable.name,
      supplySourceName: supplySourcesTable.name,
      quantity: stockReceiptsTable.quantity,
      importDate: stockReceiptsTable.importDate,
      note: stockReceiptsTable.note,
      createdAt: stockReceiptsTable.createdAt,
    })
    .from(stockReceiptsTable)
    .leftJoin(productsTable, eq(stockReceiptsTable.productId, productsTable.id))
    .leftJoin(productTypesTable, eq(productsTable.productTypeId, productTypesTable.id))
    .leftJoin(supplySourcesTable, eq(productsTable.supplySourceId, supplySourcesTable.id))
    .orderBy(desc(stockReceiptsTable.createdAt));

  res.json(receipts.map(r => ({
    ...r,
    importDate: r.importDate ? String(r.importDate) : null,
    createdAt: r.createdAt?.toISOString(),
  })));
});

router.post("/stock-receipts", async (req, res) => {
  const { productId, quantity, importDate, note = null } = req.body as {
    productId?: number; quantity?: number; importDate?: string; note?: string | null;
  };
  if (!productId || !quantity || !importDate) {
    res.status(400).json({ error: "productId, quantity, importDate are required" }); return;
  }
  const [receipt] = await db.insert(stockReceiptsTable).values({ productId, quantity, importDate, note }).returning();

  await db.update(productsTable)
    .set({ quantity: sql`${productsTable.quantity} + ${quantity}` })
    .where(eq(productsTable.id, productId));

  const [full] = await db
    .select({
      id: stockReceiptsTable.id,
      productId: stockReceiptsTable.productId,
      productName: productsTable.name,
      productTypeName: productTypesTable.name,
      supplySourceName: supplySourcesTable.name,
      quantity: stockReceiptsTable.quantity,
      importDate: stockReceiptsTable.importDate,
      note: stockReceiptsTable.note,
      createdAt: stockReceiptsTable.createdAt,
    })
    .from(stockReceiptsTable)
    .leftJoin(productsTable, eq(stockReceiptsTable.productId, productsTable.id))
    .leftJoin(productTypesTable, eq(productsTable.productTypeId, productTypesTable.id))
    .leftJoin(supplySourcesTable, eq(productsTable.supplySourceId, supplySourcesTable.id))
    .where(eq(stockReceiptsTable.id, receipt.id));

  res.status(201).json({
    ...full,
    importDate: full?.importDate ? String(full.importDate) : null,
    createdAt: full?.createdAt?.toISOString(),
  });
});

router.delete("/stock-receipts/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [receipt] = await db.select().from(stockReceiptsTable).where(eq(stockReceiptsTable.id, id));
  if (!receipt) { res.status(404).json({ error: "Not found" }); return; }

  await db.update(productsTable)
    .set({ quantity: sql`${productsTable.quantity} - ${receipt.quantity}` })
    .where(eq(productsTable.id, receipt.productId));

  await db.delete(stockReceiptsTable).where(eq(stockReceiptsTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
