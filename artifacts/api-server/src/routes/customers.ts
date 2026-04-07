import { Router } from "express";
import { db } from "@workspace/db";
import {
  customersTable,
  ordersTable,
  customerStatusesTable,
  employeesTable,
  customerSourcesTable,
  productTypesTable,
  supplySourcesTable,
  productsTable,
} from "@workspace/db/schema";
import { eq, and, sql, desc, ilike, or, SQL } from "drizzle-orm";

const router = Router();

interface OrderInput {
  closedAt?: string | null;
  orderCode?: string | null;
  productTypeId?: number | null;
  supplySourceId?: number | null;
  productId?: number | null;
  customProductName?: string | null;
  quantity?: number;
  sellPrice?: number;
  costPrice?: number;
  revenue?: number;
  profit?: number;
  warrantyMonths?: number | null;
  warrantySourceMonths?: number | null;
  warrantyCode?: string | null;
  note?: string | null;
}

async function getCustomerWithOrders(customerId: number) {
  const [customer] = await db
    .select({
      id: customersTable.id,
      code: customersTable.code,
      createdAt: customersTable.createdAt,
      name: customersTable.name,
      phone: customersTable.phone,
      address: customersTable.address,
      note: customersTable.note,
      statusId: customersTable.statusId,
      statusName: customerStatusesTable.name,
      statusColor: customerStatusesTable.color,
      employeeId: customersTable.employeeId,
      employeeName: employeesTable.name,
      sourceId: customersTable.sourceId,
      sourceName: customerSourcesTable.name,
      lastContactAt: customersTable.lastContactAt,
      nextContactAt: customersTable.nextContactAt,
    })
    .from(customersTable)
    .leftJoin(customerStatusesTable, eq(customersTable.statusId, customerStatusesTable.id))
    .leftJoin(employeesTable, eq(customersTable.employeeId, employeesTable.id))
    .leftJoin(customerSourcesTable, eq(customersTable.sourceId, customerSourcesTable.id))
    .where(eq(customersTable.id, customerId));

  if (!customer) return null;

  const orders = await db
    .select({
      id: ordersTable.id,
      customerId: ordersTable.customerId,
      closedAt: ordersTable.closedAt,
      orderCode: ordersTable.orderCode,
      productTypeId: ordersTable.productTypeId,
      productTypeName: productTypesTable.name,
      supplySourceId: ordersTable.supplySourceId,
      supplySourceName: supplySourcesTable.name,
      productId: ordersTable.productId,
      productName: productsTable.name,
      customProductName: ordersTable.customProductName,
      quantity: ordersTable.quantity,
      sellPrice: ordersTable.sellPrice,
      costPrice: ordersTable.costPrice,
      revenue: ordersTable.revenue,
      profit: ordersTable.profit,
      warrantyMonths: ordersTable.warrantyMonths,
      warrantySourceMonths: ordersTable.warrantySourceMonths,
      warrantyCode: ordersTable.warrantyCode,
      warrantyExpiry: ordersTable.warrantyExpiry,
      note: ordersTable.note,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .leftJoin(productTypesTable, eq(ordersTable.productTypeId, productTypesTable.id))
    .leftJoin(supplySourcesTable, eq(ordersTable.supplySourceId, supplySourcesTable.id))
    .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
    .where(eq(ordersTable.customerId, customerId))
    .orderBy(desc(ordersTable.createdAt));

  const totalRevenue = orders.reduce((s, o) => s + (Number(o.revenue) || 0), 0);
  const totalProfit = orders.reduce((s, o) => s + (Number(o.profit) || 0), 0);

  return {
    ...customer,
    createdAt: customer.createdAt?.toISOString(),
    lastContactAt: customer.lastContactAt?.toISOString() ?? null,
    nextContactAt: customer.nextContactAt?.toISOString() ?? null,
    orders: orders.map(o => ({
      ...o,
      closedAt: o.closedAt?.toISOString() ?? null,
      warrantyExpiry: o.warrantyExpiry?.toISOString() ?? null,
      createdAt: o.createdAt?.toISOString(),
    })),
    totalRevenue,
    totalProfit,
  };
}

router.get("/customers", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const statusId = req.query.statusId ? Number(req.query.statusId) : undefined;
  const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
  const needFollowUp = req.query.needFollowUp === "true";
  const offset = (page - 1) * pageSize;

  const search = req.query.search ? String(req.query.search).trim() : undefined;

  const conditions: SQL[] = [];
  if (statusId) conditions.push(eq(customersTable.statusId, statusId));
  if (employeeId) conditions.push(eq(customersTable.employeeId, employeeId));
  if (needFollowUp) {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    conditions.push(sql`${customersTable.nextContactAt} <= ${sevenDaysFromNow}`);
  }
  if (search) {
    conditions.push(or(
      ilike(customersTable.name, `%${search}%`),
      ilike(customersTable.phone, `%${search}%`),
    ) as SQL);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allCustomers = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(whereClause);

  const total = allCustomers.length;
  const totalPages = Math.ceil(total / pageSize);

  const customerIds = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(whereClause)
    .orderBy(desc(customersTable.createdAt))
    .limit(pageSize)
    .offset(offset);

  const customers = await Promise.all(customerIds.map(c => getCustomerWithOrders(c.id)));

  res.json({
    customers: customers.filter(Boolean),
    total,
    page,
    pageSize,
    totalPages,
  });
});

router.get("/customers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const customer = await getCustomerWithOrders(id);
  if (!customer) { res.status(404).json({ error: "Not found" }); return; }
  res.json(customer);
});

async function insertOrders(customerId: number, orders: OrderInput[]): Promise<void> {
  for (const order of orders) {
    const warrantyExpiry = order.closedAt && order.warrantyMonths
      ? new Date(new Date(order.closedAt).setMonth(new Date(order.closedAt).getMonth() + order.warrantyMonths))
      : null;

    await db.insert(ordersTable).values({
      customerId,
      closedAt: order.closedAt ? new Date(order.closedAt) : null,
      orderCode: order.orderCode ?? null,
      productTypeId: order.productTypeId ?? null,
      supplySourceId: order.supplySourceId ?? null,
      productId: order.productId ?? null,
      customProductName: order.customProductName ?? null,
      quantity: order.quantity ?? 1,
      sellPrice: order.sellPrice ?? 0,
      costPrice: order.costPrice ?? 0,
      revenue: order.revenue ?? 0,
      profit: order.profit ?? 0,
      warrantyMonths: order.warrantyMonths ?? null,
      warrantySourceMonths: order.warrantySourceMonths ?? null,
      warrantyCode: order.warrantyCode ?? null,
      warrantyExpiry,
      note: order.note ?? null,
    });

    if (order.productId) {
      await db.update(productsTable)
        .set({ quantity: sql`${productsTable.quantity} - 1` })
        .where(eq(productsTable.id, order.productId));
    }
  }
}

router.post("/customers", async (req, res) => {
  const body = req.body as {
    name?: string; phone?: string; address?: string | null; note?: string | null;
    statusId?: number; employeeId?: number; sourceId?: number | null;
    lastContactAt?: string | null; nextContactAt?: string | null; createdAt?: string;
    orders?: OrderInput[];
  };
  const { name, phone, address = null, note = null, statusId, employeeId, sourceId = null, lastContactAt = null, nextContactAt = null, createdAt, orders = [] } = body;

  if (!name || !phone) { res.status(400).json({ error: "name and phone are required" }); return; }

  const allCustomers = await db.select({ id: customersTable.id }).from(customersTable);
  const code = `KH${allCustomers.length + 1}`;

  const [customer] = await db.insert(customersTable).values({
    code,
    name,
    phone,
    address,
    note,
    statusId: statusId!,
    employeeId: employeeId!,
    sourceId,
    lastContactAt: lastContactAt ? new Date(lastContactAt) : null,
    nextContactAt: nextContactAt ? new Date(nextContactAt) : null,
    createdAt: createdAt ? new Date(createdAt) : new Date(),
  }).returning();

  await insertOrders(customer.id, orders);

  const result = await getCustomerWithOrders(customer.id);
  res.status(201).json(result);
});

router.put("/customers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as {
    name?: string; phone?: string; address?: string | null; note?: string | null;
    statusId?: number; employeeId?: number; sourceId?: number | null;
    lastContactAt?: string | null; nextContactAt?: string | null;
    orders?: OrderInput[];
  };
  const { name, phone, address = null, note = null, statusId, employeeId, sourceId = null, lastContactAt = null, nextContactAt = null, orders } = body;

  if (!name || !phone) { res.status(400).json({ error: "name and phone are required" }); return; }

  await db.update(customersTable).set({
    name, phone, address, note,
    statusId: statusId!,
    employeeId: employeeId!,
    sourceId,
    lastContactAt: lastContactAt ? new Date(lastContactAt) : null,
    nextContactAt: nextContactAt ? new Date(nextContactAt) : null,
  }).where(eq(customersTable.id, id));

  if (orders !== undefined) {
    const existingOrders = await db
      .select({ productId: ordersTable.productId })
      .from(ordersTable)
      .where(eq(ordersTable.customerId, id));
    for (const existing of existingOrders) {
      if (existing.productId) {
        await db.update(productsTable)
          .set({ quantity: sql`${productsTable.quantity} + 1` })
          .where(eq(productsTable.id, existing.productId));
      }
    }
    await db.delete(ordersTable).where(eq(ordersTable.customerId, id));
    await insertOrders(id, orders);
  }

  const result = await getCustomerWithOrders(id);
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result);
});

router.delete("/customers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existingOrders = await db
    .select({ productId: ordersTable.productId })
    .from(ordersTable)
    .where(eq(ordersTable.customerId, id));
  for (const order of existingOrders) {
    if (order.productId) {
      await db.update(productsTable)
        .set({ quantity: sql`${productsTable.quantity} + 1` })
        .where(eq(productsTable.id, order.productId));
    }
  }
  await db.delete(ordersTable).where(eq(ordersTable.customerId, id));
  await db.delete(customersTable).where(eq(customersTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
