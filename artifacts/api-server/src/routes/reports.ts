import { Router } from "express";
import { db } from "@workspace/db";
import {
  customersTable,
  ordersTable,
  customerStatusesTable,
  employeesTable,
  customerSourcesTable,
  productsTable,
} from "@workspace/db/schema";
import { eq, sql, desc, gte, lte, and, lt } from "drizzle-orm";

const router = Router();

router.get("/reports/summary", async (req, res) => {
  const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : null;
  const toDate = req.query.toDate ? new Date(req.query.toDate as string) : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Total customers
  const [customerCount] = await db.select({ count: sql<number>`count(*)` }).from(customersTable);
  const totalCustomers = Number(customerCount.count);

  // Customers today
  const [todayCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customersTable)
    .where(gte(customersTable.createdAt, today));
  const todayCustomers = Number(todayCount.count);

  // Revenue and profit from orders within date range
  let revenueQuery = db.select({
    totalRevenue: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)`,
    totalProfit: sql<number>`coalesce(sum(${ordersTable.profit}), 0)`,
    warrantyRisk: sql<number>`coalesce(sum(case when ${ordersTable.warrantyExpiry} > now() then ${ordersTable.revenue} * 0.05 else 0 end), 0)`,
  }).from(ordersTable);

  const conditions = [];
  if (fromDate) conditions.push(gte(ordersTable.closedAt, fromDate));
  if (toDate) {
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(ordersTable.closedAt, endDate));
  }

  const [revenueData] = conditions.length > 0
    ? await revenueQuery.where(and(...conditions))
    : await revenueQuery;

  // Inventory capital from products
  const [invData] = await db.select({
    totalCapital: sql<number>`coalesce(sum(${productsTable.quantity} * ${productsTable.costPrice}), 0)`,
    productsNeedPush: sql<number>`count(case when ${productsTable.quantity} > 0 then 1 end)`,
  }).from(productsTable);

  // Average inventory age (simplified: days since product was created weighted by quantity)
  const [ageData] = await db.select({
    avgAge: sql<number>`coalesce(avg(extract(day from now() - ${productsTable.createdAt})), 0)`,
    turnover: sql<number>`coalesce(sum(${productsTable.quantity}), 0)`,
  }).from(productsTable);

  const inventoryCapital = Number(invData.totalCapital);
  const avgAge = Number(ageData.avgAge) || 0;
  const totalQuantity = Number(ageData.turnover) || 0;
  // Simple turnover: if avg age is 0 use 0, else 30/avgAge
  const turnover = avgAge > 0 ? Math.round((30 / avgAge) * 100) / 100 : 0;

  res.json({
    safeProfit: Math.floor(Number(revenueData.totalProfit) * 0.95),
    warrantyRiskAmount: Math.floor(Number(revenueData.warrantyRisk)),
    inventoryCapital,
    productsNeedPush: Number(invData.productsNeedPush),
    inventoryTurnover: turnover,
    averageInventoryAge: Math.round(avgAge),
    totalCustomers,
    totalRevenue: Number(revenueData.totalRevenue),
    todayCustomers,
    totalProfit: Number(revenueData.totalProfit),
  });
});

router.get("/reports/status-distribution", async (req, res) => {
  const data = await db
    .select({
      statusId: customerStatusesTable.id,
      statusName: customerStatusesTable.name,
      statusColor: customerStatusesTable.color,
      count: sql<number>`count(${customersTable.id})`,
    })
    .from(customerStatusesTable)
    .leftJoin(customersTable, eq(customersTable.statusId, customerStatusesTable.id))
    .groupBy(customerStatusesTable.id, customerStatusesTable.name, customerStatusesTable.color)
    .orderBy(customerStatusesTable.sortOrder);

  res.json(data.map(d => ({ ...d, count: Number(d.count) })));
});

router.get("/reports/customers-by-employee", async (req, res) => {
  // Get all employees
  const employees = await db.select().from(employeesTable);
  const statuses = await db.select().from(customerStatusesTable);

  const result = await Promise.all(employees.map(async (emp) => {
    const statusBreakdown: Record<string, number> = {};
    for (const status of statuses) {
      const [cnt] = await db
        .select({ count: sql<number>`count(*)` })
        .from(customersTable)
        .where(and(
          eq(customersTable.employeeId, emp.id),
          eq(customersTable.statusId, status.id),
        ));
      statusBreakdown[status.name] = Number(cnt.count);
    }
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      statusBreakdown,
    };
  }));

  res.json(result);
});

router.get("/reports/daily-trend", async (req, res) => {
  const fromDate = req.query.fromDate
    ? new Date(req.query.fromDate as string)
    : new Date(new Date().setDate(new Date().getDate() - 30));
  const toDate = req.query.toDate
    ? new Date(req.query.toDate as string)
    : new Date();

  // Generate date series
  const dates: string[] = [];
  const current = new Date(fromDate);
  while (current <= toDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  const result = await Promise.all(dates.map(async (date) => {
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [newCust] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customersTable)
      .where(and(gte(customersTable.createdAt, dayStart), lte(customersTable.createdAt, dayEnd)));

    const [closedOrd] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(and(
        sql`${ordersTable.closedAt} is not null`,
        gte(ordersTable.closedAt, dayStart),
        lte(ordersTable.closedAt, dayEnd),
      ));

    return {
      date,
      newCustomers: Number(newCust.count),
      closedOrders: Number(closedOrd.count),
    };
  }));

  res.json(result);
});

router.get("/reports/customers-by-source", async (req, res) => {
  const sources = await db.select().from(customerSourcesTable);

  // "Đã chốt" status IDs - find statuses with "chốt" in name
  const statuses = await db.select().from(customerStatusesTable);
  const closedStatusIds = statuses
    .filter(s => s.name.toLowerCase().includes("chốt"))
    .map(s => s.id);

  const result = await Promise.all(sources.map(async (source) => {
    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customersTable)
      .where(eq(customersTable.sourceId, source.id));

    const closed = closedStatusIds.length > 0 ?
      await Promise.all(closedStatusIds.map(async (sid) => {
        const [cnt] = await db
          .select({ count: sql<number>`count(*)` })
          .from(customersTable)
          .where(and(eq(customersTable.sourceId, source.id), eq(customersTable.statusId, sid)));
        return Number(cnt.count);
      })) : [0];

    const closedCount = closed.reduce((a, b) => a + b, 0);
    const notClosed = Number(total.count) - closedCount;

    return {
      sourceName: source.name,
      closed: closedCount,
      notClosed: notClosed,
    };
  }));

  // Also add "Chưa xác định" for customers without source
  const [noSource] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customersTable)
    .where(sql`${customersTable.sourceId} is null`);

  if (Number(noSource.count) > 0) {
    result.push({ sourceName: "Chưa xác định", closed: 0, notClosed: Number(noSource.count) });
  }

  res.json(result);
});

router.get("/reports/top-sales", async (req, res) => {
  const employees = await db.select().from(employeesTable);
  const statuses = await db.select().from(customerStatusesTable);
  const closedStatusIds = statuses
    .filter(s => s.name.toLowerCase().includes("chốt"))
    .map(s => s.id);

  const result = await Promise.all(employees.map(async (emp) => {
    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customersTable)
      .where(eq(customersTable.employeeId, emp.id));

    let closedCount = 0;
    if (closedStatusIds.length > 0) {
      const closedCounts = await Promise.all(closedStatusIds.map(async (sid) => {
        const [cnt] = await db
          .select({ count: sql<number>`count(*)` })
          .from(customersTable)
          .where(and(eq(customersTable.employeeId, emp.id), eq(customersTable.statusId, sid)));
        return Number(cnt.count);
      }));
      closedCount = closedCounts.reduce((a, b) => a + b, 0);
    }

    const totalCount = Number(total.count);
    const closeRate = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) / 100 : 0;

    return {
      employeeName: emp.name,
      closeRate,
      closedCount,
    };
  }));

  res.json(result.sort((a, b) => b.closeRate - a.closeRate));
});

router.get("/reports/monthly-trend", async (req, res) => {
  // Last 12 months
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
  }

  const result = await Promise.all(months.map(async (monthStr) => {
    const [m, y] = monthStr.split("/");
    const start = new Date(Number(y), Number(m) - 1, 1);
    const end = new Date(Number(y), Number(m), 0, 23, 59, 59);

    const [newCust] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customersTable)
      .where(and(gte(customersTable.createdAt, start), lte(customersTable.createdAt, end)));

    const [closedOrd] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(and(
        sql`${ordersTable.closedAt} is not null`,
        gte(ordersTable.closedAt, start),
        lte(ordersTable.closedAt, end),
      ));

    return {
      month: monthStr,
      newCustomers: Number(newCust.count),
      closedOrders: Number(closedOrd.count),
    };
  }));

  res.json(result);
});

router.get("/reports/monthly-profit", async (req, res) => {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
  }

  const result = await Promise.all(months.map(async (monthStr) => {
    const [m, y] = monthStr.split("/");
    const start = new Date(Number(y), Number(m) - 1, 1);
    const end = new Date(Number(y), Number(m), 0, 23, 59, 59);

    const [profitData] = await db
      .select({ profit: sql<number>`coalesce(sum(${ordersTable.profit}), 0)` })
      .from(ordersTable)
      .where(and(
        sql`${ordersTable.closedAt} is not null`,
        gte(ordersTable.closedAt, start),
        lte(ordersTable.closedAt, end),
      ));

    return {
      month: monthStr,
      profit: Number(profitData.profit),
    };
  }));

  res.json(result);
});

router.get("/reports/top-customers", async (req, res) => {
  const limit = Number(req.query.limit) || 10;

  const customers = await db
    .select({
      customerId: customersTable.id,
      customerName: customersTable.name,
      totalRevenue: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)`,
      totalProfit: sql<number>`coalesce(sum(${ordersTable.profit}), 0)`,
    })
    .from(customersTable)
    .leftJoin(ordersTable, eq(ordersTable.customerId, customersTable.id))
    .groupBy(customersTable.id, customersTable.name)
    .orderBy(desc(sql`coalesce(sum(${ordersTable.revenue}), 0)`))
    .limit(limit);

  res.json(customers.map(c => ({
    ...c,
    totalRevenue: Number(c.totalRevenue),
    totalProfit: Number(c.totalProfit),
  })));
});

router.get("/reports/revenue-by-source", async (req, res) => {
  const sources = await db.select().from(customerSourcesTable);

  const result = await Promise.all(sources.map(async (source) => {
    const [rev] = await db
      .select({ total: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)` })
      .from(ordersTable)
      .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(eq(customersTable.sourceId, source.id));

    return {
      sourceName: source.name,
      totalRevenue: Number(rev.total),
    };
  }));

  res.json(result);
});

router.get("/reports/revenue-by-employee", async (req, res) => {
  const employees = await db.select().from(employeesTable);

  const result = await Promise.all(employees.map(async (emp) => {
    const [rev] = await db
      .select({ total: sql<number>`coalesce(sum(${ordersTable.revenue}), 0)` })
      .from(ordersTable)
      .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(eq(customersTable.employeeId, emp.id));

    return {
      employeeName: emp.name,
      totalRevenue: Number(rev.total),
    };
  }));

  res.json(result.sort((a, b) => b.totalRevenue - a.totalRevenue));
});

router.get("/reports/expiring-warranties", async (req, res) => {
  const days = Number(req.query.days) || 30;
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  const orders = await db
    .select({
      orderId: ordersTable.id,
      orderCode: ordersTable.orderCode,
      customerId: customersTable.id,
      customerName: customersTable.name,
      phone: customersTable.phone,
      productTypeName: sql<string>`pt.name`,
      supplySourceName: sql<string>`ss.name`,
      warrantyExpiry: ordersTable.warrantyExpiry,
    })
    .from(ordersTable)
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .leftJoin(sql`product_types pt`, sql`${ordersTable.productTypeId} = pt.id`)
    .leftJoin(sql`supply_sources ss`, sql`${ordersTable.supplySourceId} = ss.id`)
    .where(and(
      sql`${ordersTable.warrantyExpiry} is not null`,
      gte(ordersTable.warrantyExpiry, now),
      lte(ordersTable.warrantyExpiry, future),
    ))
    .orderBy(asc(ordersTable.warrantyExpiry));

  res.json(orders.map(o => ({
    ...o,
    warrantyExpiry: o.warrantyExpiry?.toISOString() || null,
  })));
});

router.get("/reports/expired-warranties", async (req, res) => {
  const now = new Date();

  const orders = await db
    .select({
      orderId: ordersTable.id,
      orderCode: ordersTable.orderCode,
      customerId: customersTable.id,
      customerName: customersTable.name,
      phone: customersTable.phone,
      productTypeName: sql<string>`pt.name`,
      supplySourceName: sql<string>`ss.name`,
      warrantyExpiry: ordersTable.warrantyExpiry,
    })
    .from(ordersTable)
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .leftJoin(sql`product_types pt`, sql`${ordersTable.productTypeId} = pt.id`)
    .leftJoin(sql`supply_sources ss`, sql`${ordersTable.supplySourceId} = ss.id`)
    .where(and(
      sql`${ordersTable.warrantyExpiry} is not null`,
      lt(ordersTable.warrantyExpiry, now),
    ))
    .orderBy(desc(ordersTable.warrantyExpiry));

  res.json(orders.map(o => ({
    ...o,
    warrantyExpiry: o.warrantyExpiry?.toISOString() || null,
  })));
});

export default router;
