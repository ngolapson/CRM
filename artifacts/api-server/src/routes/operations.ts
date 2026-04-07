import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, productsTable, productTypesTable, supplySourcesTable, stockReceiptsTable, customersTable } from "@workspace/db/schema";
import { sql, gte, lte, and, eq, desc } from "drizzle-orm";

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

router.get("/operations/sales-monthly", async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0, 23, 59, 59);

  const [monthStats] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)`,
      orders: sql<number>`count(*)`,
      profit: sql<number>`coalesce(sum(${ordersTable.profit}), 0)`,
      costTotal: sql<number>`coalesce(sum(${ordersTable.costPrice} * ${ordersTable.quantity}), 0)`,
    })
    .from(ordersTable)
    .where(and(
      sql`${ordersTable.closedAt} is not null`,
      gte(ordersTable.closedAt, firstDay),
      lte(ordersTable.closedAt, lastDay),
    ));

  const daysInMonth = lastDay.getDate();
  const dailyRevenue = await Promise.all(
    Array.from({ length: daysInMonth }, async (_, i) => {
      const day = i + 1;
      const dayStart = new Date(year, month, day);
      const dayEnd = new Date(year, month, day, 23, 59, 59);
      const [d] = await db
        .select({ revenue: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)` })
        .from(ordersTable)
        .where(and(
          sql`${ordersTable.closedAt} is not null`,
          gte(ordersTable.closedAt, dayStart),
          lte(ordersTable.closedAt, dayEnd),
        ));
      return { day, revenue: Number(d.revenue) };
    })
  );

  const topProducts = await db
    .select({
      productId: ordersTable.productId,
      productName: productsTable.name,
      productTypeName: productTypesTable.name,
      supplySourceName: supplySourcesTable.name,
      totalRevenue: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)`,
      totalProfit: sql<number>`coalesce(sum(${ordersTable.profit}), 0)`,
      totalSold: sql<number>`coalesce(sum(${ordersTable.quantity}), 0)`,
    })
    .from(ordersTable)
    .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
    .leftJoin(productTypesTable, eq(productsTable.productTypeId, productTypesTable.id))
    .leftJoin(supplySourcesTable, eq(productsTable.supplySourceId, supplySourcesTable.id))
    .where(and(
      sql`${ordersTable.closedAt} is not null`,
      sql`${ordersTable.productId} is not null`,
      gte(ordersTable.closedAt, firstDay),
      lte(ordersTable.closedAt, lastDay),
    ))
    .groupBy(ordersTable.productId, productsTable.name, productTypesTable.name, supplySourcesTable.name)
    .orderBy(desc(sql`sum(${ordersTable.revenue})`))
    .limit(10);

  const [customerCount] = await db
    .select({ count: sql<number>`count(distinct ${ordersTable.customerId})` })
    .from(ordersTable)
    .where(and(
      sql`${ordersTable.closedAt} is not null`,
      gte(ordersTable.closedAt, firstDay),
      lte(ordersTable.closedAt, lastDay),
    ));

  res.json({
    monthRevenue: Number(monthStats.revenue),
    monthOrders: Number(monthStats.orders),
    monthCustomers: Number(customerCount.count),
    monthProfit: Number(monthStats.profit),
    monthCostTotal: Number(monthStats.costTotal),
    dailyRevenue,
    topProducts: topProducts.map(p => ({
      productId: p.productId,
      productName: p.productName ?? p.productId,
      productTypeName: p.productTypeName,
      supplySourceName: p.supplySourceName,
      totalRevenue: Number(p.totalRevenue),
      totalProfit: Number(p.totalProfit),
      totalSold: Number(p.totalSold),
    })),
  });
});

router.get("/operations/profit-loss", async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0, 23, 59, 59);

  const [monthStats] = await db
    .select({
      profit: sql<number>`coalesce(sum(${ordersTable.profit}), 0)`,
      revenue: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)`,
      costTotal: sql<number>`coalesce(sum(${ordersTable.costPrice} * ${ordersTable.quantity}), 0)`,
    })
    .from(ordersTable)
    .where(and(
      sql`${ordersTable.closedAt} is not null`,
      gte(ordersTable.closedAt, firstDay),
      lte(ordersTable.closedAt, lastDay),
    ));

  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
  }

  const profitByMonth = await Promise.all(months.map(async (monthStr) => {
    const [m, y] = monthStr.split("/");
    const start = new Date(Number(y), Number(m) - 1, 1);
    const end = new Date(Number(y), Number(m), 0, 23, 59, 59);

    const [d] = await db
      .select({
        profit: sql<number>`coalesce(sum(${ordersTable.profit}), 0)`,
        revenue: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)`,
        cost: sql<number>`coalesce(sum(${ordersTable.costPrice} * ${ordersTable.quantity}), 0)`,
      })
      .from(ordersTable)
      .where(and(
        sql`${ordersTable.closedAt} is not null`,
        gte(ordersTable.closedAt, start),
        lte(ordersTable.closedAt, end),
      ));

    return {
      month: monthStr,
      profit: Number(d.profit),
      revenue: Number(d.revenue),
      cost: Number(d.cost),
    };
  }));

  res.json({
    monthProfit: Number(monthStats.profit),
    monthRevenue: Number(monthStats.revenue),
    monthCostTotal: Number(monthStats.costTotal),
    profitByMonth,
  });
});

router.get("/operations/inventory", async (req, res) => {
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

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [receiptsRaw, ordersRaw, orders30dRaw] = await Promise.all([
    db.select({
      productId: stockReceiptsTable.productId,
      totalImported: sql<number>`sum(${stockReceiptsTable.quantity})`,
      lastImportDate: sql<string>`max(${stockReceiptsTable.importDate})`,
    }).from(stockReceiptsTable).groupBy(stockReceiptsTable.productId),
    db.select({
      productId: ordersTable.productId,
      totalSold: sql<number>`sum(${ordersTable.quantity})`,
    }).from(ordersTable)
      .where(and(sql`${ordersTable.closedAt} is not null`, sql`${ordersTable.productId} is not null`))
      .groupBy(ordersTable.productId),
    db.select({
      productId: ordersTable.productId,
      soldLast30Days: sql<number>`sum(${ordersTable.quantity})`,
    }).from(ordersTable)
      .where(and(
        sql`${ordersTable.closedAt} is not null`,
        sql`${ordersTable.productId} is not null`,
        gte(ordersTable.closedAt, thirtyDaysAgo),
      ))
      .groupBy(ordersTable.productId),
  ]);

  const importMap = new Map(receiptsRaw.map(r => [r.productId, { totalImported: Number(r.totalImported), lastImportDate: r.lastImportDate }]));
  const soldMap = new Map(ordersRaw.map(r => [r.productId, Number(r.totalSold)]));
  const sold30dMap = new Map(orders30dRaw.map(r => [r.productId, Number(r.soldLast30Days)]));

  const now = new Date();
  const result = products.map(p => {
    const imported = importMap.get(p.id);
    const totalImported = imported?.totalImported ?? 0;
    const totalSold = soldMap.get(p.id) ?? 0;
    const soldLast30Days = sold30dMap.get(p.id) ?? 0;
    const lastImportDate = imported?.lastImportDate ?? p.createdAt?.toISOString().split("T")[0] ?? null;
    const daysSinceImport = lastImportDate
      ? Math.floor((now.getTime() - new Date(lastImportDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    return {
      id: p.id,
      name: p.name,
      productTypeId: p.productTypeId,
      productTypeName: p.productTypeName,
      supplySourceId: p.supplySourceId,
      supplySourceName: p.supplySourceName,
      quantity: p.quantity,
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
      warrantyMonths: p.warrantyMonths,
      note: p.note,
      createdAt: p.createdAt?.toISOString(),
      totalImported,
      totalSold,
      soldLast30Days,
      lastImportDate,
      daysSinceImport,
      inventoryValue: p.quantity * p.costPrice,
    };
  });

  res.json(result);
});

router.get("/operations/warranty", async (req, res) => {
  const now = new Date();

  const orders = await db
    .select({
      orderId: ordersTable.id,
      orderCode: ordersTable.orderCode,
      customerId: ordersTable.customerId,
      customerName: customersTable.name,
      customerPhone: customersTable.phone,
      customerEmail: customersTable.email,
      productTypeName: productTypesTable.name,
      supplySourceName: supplySourcesTable.name,
      customProductName: ordersTable.customProductName,
      warrantyCode: ordersTable.warrantyCode,
      warrantyExpiry: ordersTable.warrantyExpiry,
    })
    .from(ordersTable)
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .leftJoin(productTypesTable, eq(ordersTable.productTypeId, productTypesTable.id))
    .leftJoin(supplySourcesTable, eq(ordersTable.supplySourceId, supplySourcesTable.id))
    .where(and(
      sql`${ordersTable.warrantyExpiry} is not null`,
      gte(ordersTable.warrantyExpiry, now),
    ))
    .orderBy(ordersTable.warrantyExpiry);

  res.json(orders.map(o => ({
    ...o,
    warrantyExpiry: o.warrantyExpiry?.toISOString() || null,
    daysRemaining: o.warrantyExpiry
      ? Math.floor((new Date(o.warrantyExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  })));
});

export default router;
