import { db } from "@workspace/db";
import {
  employeesTable,
  customerStatusesTable,
  customerSourcesTable,
  productTypesTable,
  supplySourcesTable,
  productsTable,
  customersTable,
  ordersTable,
} from "@workspace/db/schema";
import { sql } from "drizzle-orm";

export async function seedIfEmpty() {
  const existing = await db.select({ id: customersTable.id }).from(customersTable).limit(1);
  if (existing.length > 0) return;

  const [emp1] = await db.insert(employeesTable).values({ name: "Administrator", role: "Admin", isProtected: true }).returning();
  const [emp2] = await db.insert(employeesTable).values({ name: "Ngô Lập Sơn", role: "Nhân viên", isProtected: false }).returning();
  const [emp3] = await db.insert(employeesTable).values({ name: "Trần Thị Mai", role: "Nhân viên", isProtected: false }).returning();

  const statuses = await db.insert(customerStatusesTable).values([
    { name: "Tiếp cận mới", color: "#3b82f6", sortOrder: 1, isSystem: false },
    { name: "Đang tư vấn", color: "#f59e0b", sortOrder: 2, isSystem: false },
    { name: "Đã gửi thông tin", color: "#8b5cf6", sortOrder: 3, isSystem: false },
    { name: "Khách lạo hội", color: "#6b7280", sortOrder: 4, isSystem: false },
    { name: "Đã chốt", color: "#10b981", sortOrder: 5, isSystem: false },
    { name: "Chăm sóc sau bán", color: "#0ea5e9", sortOrder: 6, isSystem: false },
  ]).returning();

  const sources = await db.insert(customerSourcesTable).values([
    { name: "Nhóm Zalo", description: "Khách từ nhóm Zalo" },
    { name: "Facebook", description: "Khách từ Facebook" },
    { name: "Website", description: "Khách từ website" },
    { name: "Giới thiệu", description: "Khách được giới thiệu" },
    { name: "TikTok", description: "Khách từ TikTok" },
  ]).returning();

  const productTypes = await db.insert(productTypesTable).values([
    { name: "Phần mềm", slug: "phan-mem" },
    { name: "Laptop", slug: "laptop" },
    { name: "Phụ kiện", slug: "phu-kien" },
  ]).returning();

  const supplySources = await db.insert(supplySourcesTable).values([
    { name: "Nhập trực tiếp" },
    { name: "Đại lý cấp 1" },
    { name: "Nhập khẩu" },
  ]).returning();

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  await db.insert(productsTable).values([
    { name: "GPT Plus 1 tháng", productTypeId: productTypes[0]!.id, supplySourceId: supplySources[0]!.id, quantity: 10, costPrice: 280000, sellPrice: 450000, warrantyMonths: 1, note: "Tài khoản ChatGPT Plus" },
    { name: "Canva Pro 1 năm", productTypeId: productTypes[0]!.id, supplySourceId: supplySources[0]!.id, quantity: 8, costPrice: 320000, sellPrice: 550000, warrantyMonths: 12, note: "Tài khoản Canva Pro" },
    { name: "MacBook Air M2 8GB", productTypeId: productTypes[1]!.id, supplySourceId: supplySources[2]!.id, quantity: 3, costPrice: 25000000, sellPrice: 29000000, warrantyMonths: 12, note: "Apple MacBook Air M2 256GB", createdAt: sixtyDaysAgo },
    { name: "MacBook Pro M3 16GB", productTypeId: productTypes[1]!.id, supplySourceId: supplySources[2]!.id, quantity: 2, costPrice: 30000000, sellPrice: 35000000, warrantyMonths: 12, note: "Apple MacBook Pro M3 512GB", createdAt: ninetyDaysAgo },
    { name: "Chuột Logitech MX Master 3", productTypeId: productTypes[2]!.id, supplySourceId: supplySources[1]!.id, quantity: 5, costPrice: 800000, sellPrice: 1200000, warrantyMonths: 24, note: "Chuột không dây cao cấp" },
    { name: "Bàn phím Keychron K8", productTypeId: productTypes[2]!.id, supplySourceId: supplySources[1]!.id, quantity: 4, costPrice: 1100000, sellPrice: 1800000, warrantyMonths: 12, note: "Bàn phím cơ TKL", createdAt: sixtyDaysAgo },
    { name: "Tai nghe Sony WH-1000XM5", productTypeId: productTypes[2]!.id, supplySourceId: supplySources[2]!.id, quantity: 3, costPrice: 3800000, sellPrice: 5500000, warrantyMonths: 12, note: "Chống ồn cao cấp" },
    { name: "SSD Samsung 870 EVO 1TB", productTypeId: productTypes[2]!.id, supplySourceId: supplySources[1]!.id, quantity: 2, costPrice: 1800000, sellPrice: 2800000, warrantyMonths: 36, note: "SSD SATA 2.5 inch" },
  ]);

  const sId = (name: string) => statuses.find(s => s.name === name)!.id;
  const srcId = (name: string) => sources.find(s => s.name === name)!.id;

  const customerData = [
    { name: "Chị Bảo Ngọc", phone: "0912345624", note: "GPT Plus cá nhân", statusName: "Đã chốt", source: "Nhóm Zalo", emp: emp1.id, created: "2026-03-28", revenue: 450000, profit: 150000, ptId: productTypes[0]!.id },
    { name: "Anh Quang Phương", phone: "0912345623", note: "AI tool cho dự án startup", statusName: "Đã gửi thông tin", source: "Website", emp: emp2.id, created: "2026-03-25", revenue: 0, profit: 0 },
    { name: "Chị Thảo", phone: "0912345622", note: "Canva Pro 1 năm 2 tài khoản", statusName: "Đã chốt", source: "Nhóm Zalo", emp: emp2.id, created: "2026-03-22", revenue: 700000, profit: 300000, ptId: productTypes[0]!.id },
    { name: "A Hùng", phone: "0912345621", note: "Laptop gaming RTX 4060", statusName: "Khách lạo hội", source: "Facebook", emp: emp1.id, created: "2026-03-21", revenue: 0, profit: 0 },
    { name: "Chị Lan Anh", phone: "0912345620", note: "Cần Office 365 Business", statusName: "Đang tư vấn", source: "Giới thiệu", emp: emp3.id, created: "2026-03-18", revenue: 0, profit: 0 },
    { name: "Anh Minh Tuấn", phone: "0912345619", note: "Mua Macbook Pro M3", statusName: "Đã chốt", source: "Website", emp: emp1.id, created: "2026-03-15", revenue: 35000000, profit: 2000000, ptId: productTypes[1]!.id },
    { name: "Chị Hương", phone: "0912345618", note: "Chuột Logitech MX Master 3", statusName: "Đã chốt", source: "Facebook", emp: emp2.id, created: "2026-03-12", revenue: 1200000, profit: 350000, ptId: productTypes[2]!.id },
    { name: "Anh Đức", phone: "0912345617", note: "Adobe Photoshop", statusName: "Tiếp cận mới", source: "TikTok", emp: emp3.id, created: "2026-03-10", revenue: 0, profit: 0 },
    { name: "Chị Phương Linh", phone: "0912345616", note: "Laptop văn phòng Dell", statusName: "Đã chốt", source: "Giới thiệu", emp: emp1.id, created: "2026-03-08", revenue: 18000000, profit: 1500000, ptId: productTypes[1]!.id },
    { name: "Anh Khoa", phone: "0912345615", note: "Tai nghe Sony WH-1000XM5", statusName: "Chăm sóc sau bán", source: "Nhóm Zalo", emp: emp2.id, created: "2026-03-05", revenue: 5500000, profit: 800000, ptId: productTypes[2]!.id },
    { name: "Chị Nga", phone: "0912345614", note: "GPT Team plan 5 users", statusName: "Đã gửi thông tin", source: "Facebook", emp: emp3.id, created: "2026-03-03", revenue: 0, profit: 0 },
    { name: "Anh Toàn", phone: "0912345613", note: "Bàn phím cơ Keychron K8", statusName: "Đã chốt", source: "TikTok", emp: emp1.id, created: "2026-03-01", revenue: 1800000, profit: 450000, ptId: productTypes[2]!.id },
    { name: "Chị Hà", phone: "0912345612", note: "Canva Teams", statusName: "Đang tư vấn", source: "Website", emp: emp2.id, created: "2026-02-25", revenue: 0, profit: 0 },
    { name: "Anh Bình", phone: "0912345611", note: "Monitor 4K LG 27", statusName: "Đã chốt", source: "Giới thiệu", emp: emp3.id, created: "2026-02-22", revenue: 8500000, profit: 1200000, ptId: productTypes[2]!.id },
    { name: "Chị Mai Anh", phone: "0912345610", note: "Office 365 Personal", statusName: "Tiếp cận mới", source: "Nhóm Zalo", emp: emp1.id, created: "2026-02-20", revenue: 0, profit: 0 },
    { name: "Anh Việt", phone: "0912345609", note: "Laptop Asus ROG gaming", statusName: "Đã chốt", source: "Facebook", emp: emp2.id, created: "2026-02-18", revenue: 32000000, profit: 3000000, ptId: productTypes[1]!.id },
    { name: "Chị Hồng", phone: "0912345608", note: "Webcam Logitech Brio", statusName: "Chăm sóc sau bán", source: "TikTok", emp: emp3.id, created: "2026-02-15", revenue: 2200000, profit: 600000, ptId: productTypes[2]!.id },
    { name: "Anh Nam", phone: "0912345607", note: "Adobe Creative Cloud", statusName: "Đã gửi thông tin", source: "Website", emp: emp1.id, created: "2026-02-12", revenue: 0, profit: 0 },
    { name: "Chị Trang", phone: "0912345606", note: "SSD Samsung 1TB", statusName: "Đã chốt", source: "Giới thiệu", emp: emp2.id, created: "2026-02-10", revenue: 2800000, profit: 700000, ptId: productTypes[2]!.id },
    { name: "Anh Hiếu", phone: "0912345605", note: "iPad Air M2", statusName: "Khách lạo hội", source: "Facebook", emp: emp3.id, created: "2026-02-08", revenue: 0, profit: 0 },
    { name: "Chị Nhung", phone: "0912345604", note: "Spotify Premium 6 tháng", statusName: "Đã chốt", source: "Nhóm Zalo", emp: emp1.id, created: "2026-02-05", revenue: 300000, profit: 100000, ptId: productTypes[0]!.id },
    { name: "Anh Cường", phone: "0912345603", note: "Laptop Lenovo ThinkPad", statusName: "Đang tư vấn", source: "TikTok", emp: emp2.id, created: "2026-02-03", revenue: 0, profit: 0 },
    { name: "Chị Yến", phone: "0912345602", note: "Google One 2TB", statusName: "Đã chốt", source: "Website", emp: emp3.id, created: "2026-02-01", revenue: 500000, profit: 200000, ptId: productTypes[0]!.id },
    { name: "Anh Sơn", phone: "0912345601", note: "MacBook Air M2", statusName: "Chăm sóc sau bán", source: "Giới thiệu", emp: emp1.id, created: "2026-01-28", revenue: 29000000, profit: 2500000, ptId: productTypes[1]!.id },
  ];

  for (let i = 0; i < customerData.length; i++) {
    const c = customerData[i]!;
    const code = `KH${customerData.length - i}`;
    const [customer] = await db.insert(customersTable).values({
      code,
      name: c.name,
      phone: c.phone,
      note: c.note,
      statusId: sId(c.statusName),
      employeeId: c.emp,
      sourceId: srcId(c.source),
      createdAt: new Date(c.created),
      lastContactAt: c.revenue > 0 ? new Date(c.created) : null,
      nextContactAt: c.revenue === 0 ? new Date(new Date(c.created).getTime() + 7 * 24 * 60 * 60 * 1000) : null,
    }).returning();

    if (c.revenue && c.revenue > 0 && c.ptId) {
      const closeDate = new Date(c.created);
      const warrantyMonths = 12;
      const warrantyExpiry = new Date(closeDate);
      warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyMonths);
      await db.insert(ordersTable).values({
        customerId: customer.id,
        closedAt: closeDate,
        orderCode: `DH${String(i + 1).padStart(3, "0")}`,
        productTypeId: c.ptId,
        supplySourceId: supplySources[0]!.id,
        revenue: c.revenue,
        profit: c.profit,
        warrantyMonths,
        warrantyExpiry,
        note: c.note,
      });
    }
  }
}
