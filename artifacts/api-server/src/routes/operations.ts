import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, productsTable } from "@workspace/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

const router = Router();

router.get("/operations/today", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [data] = await db
    .select({
      todayRevenue: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)`,
      todayOrders: sql<number>`count(*)`,
      todayProfit: sql<number>`coalesce(sum(${ordersTable.profit}), 0)`,
    })
    .from(ordersTable)
    .where(and(
      sql`${ordersTable.closedAt} is not null`,
      gte(ordersTable.closedAt, today),
      sql`${ordersTable.closedAt} < ${tomorrow}`,
    ));

  res.json({
    todayRevenue: Number(data.todayRevenue),
    todayOrders: Number(data.todayOrders),
    todayProfit: Number(data.todayProfit),
  });
});

router.get("/operations/sales-trend", async (req, res) => {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const result = await Promise.all(dates.map(async (date) => {
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [data] = await db
      .select({ revenue: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)` })
      .from(ordersTable)
      .where(and(
        sql`${ordersTable.closedAt} is not null`,
        gte(ordersTable.closedAt, dayStart),
        lte(ordersTable.closedAt, dayEnd),
      ));

    return {
      date,
      revenue: Number(data.revenue),
    };
  }));

  res.json(result);
});

router.get("/operations/inventory-summary", async (req, res) => {
  const [data] = await db
    .select({
      totalCapital: sql<number>`coalesce(sum(${productsTable.quantity} * ${productsTable.costPrice}), 0)`,
    })
    .from(productsTable);

  // Count products by age
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [above30] = await db.select({ count: sql<number>`count(*)` })
    .from(productsTable).where(sql`${productsTable.createdAt} <= ${thirtyDaysAgo} AND ${productsTable.quantity} > 0`);
  const [above60] = await db.select({ count: sql<number>`count(*)` })
    .from(productsTable).where(sql`${productsTable.createdAt} <= ${sixtyDaysAgo} AND ${productsTable.quantity} > 0`);
  const [above90] = await db.select({ count: sql<number>`count(*)` })
    .from(productsTable).where(sql`${productsTable.createdAt} <= ${ninetyDaysAgo} AND ${productsTable.quantity} > 0`);
  const [lowStock] = await db.select({ count: sql<number>`count(*)` })
    .from(productsTable).where(sql`${productsTable.quantity} > 0 AND ${productsTable.quantity} < 5`);

  res.json({
    totalCapital: Number(data.totalCapital),
    above30Days: Number(above30.count),
    above60Days: Number(above60.count),
    above90Days: Number(above90.count),
    lowStock: Number(lowStock.count),
  });
});

export default router;
