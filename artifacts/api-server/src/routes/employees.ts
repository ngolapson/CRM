import { Router } from "express";
import { db } from "@workspace/db";
import { employeesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

function mapEmployee(e: typeof employeesTable.$inferSelect) {
  return {
    id: e.id,
    name: e.name,
    role: e.role,
    isProtected: e.isProtected,
    position: e.position ?? null,
    username: e.username ?? null,
    photoUrl: e.photoUrl ?? null,
    managerId: e.managerId ?? null,
    createdAt: e.createdAt?.toISOString(),
  };
}

async function getRequesterRole(req: { headers: Record<string, string | string[] | undefined> }): Promise<string | null> {
  const idHeader = req.headers["x-employee-id"];
  const id = typeof idHeader === "string" ? Number(idHeader) : null;
  if (!id || isNaN(id)) return null;
  const [emp] = await db.select({ role: employeesTable.role }).from(employeesTable).where(eq(employeesTable.id, id));
  return emp?.role ?? null;
}

router.get("/employees", async (_req, res) => {
  const employees = await db.select().from(employeesTable).orderBy(employeesTable.id);
  res.json(employees.map(mapEmployee));
});

router.post("/employees", async (req, res) => {
  const requesterRole = await getRequesterRole(req);
  if (requesterRole !== "Admin") {
    res.status(403).json({ error: "Chỉ quản trị viên mới có thể thêm tài khoản nhân viên" });
    return;
  }

  const { name, role = "Nhân viên", position = "", username = null, password = null, photoUrl = null, managerId = null } = req.body as {
    name?: string; role?: string; position?: string; username?: string | null;
    password?: string | null; photoUrl?: string | null; managerId?: number | null;
  };
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const [emp] = await db.insert(employeesTable).values({ name, role, position, username, passwordHash, photoUrl, managerId }).returning();
  res.status(201).json(mapEmployee(emp));
});

router.put("/employees/:id", async (req, res) => {
  const id = Number(req.params.id);
  const requesterRole = await getRequesterRole(req);
  if (requesterRole !== "Admin") {
    res.status(403).json({ error: "Chỉ quản trị viên mới có thể sửa tài khoản nhân viên" });
    return;
  }

  const { name, role = "Nhân viên", position = "", username = null, password = null, photoUrl = null, managerId = null } = req.body as {
    name?: string; role?: string; position?: string; username?: string | null;
    password?: string | null; photoUrl?: string | null; managerId?: number | null;
  };
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const [target] = await db.select({ isProtected: employeesTable.isProtected, role: employeesTable.role }).from(employeesTable).where(eq(employeesTable.id, id));
  if (!target) { res.status(404).json({ error: "Not found" }); return; }

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
  const setData = passwordHash
    ? { name, role, position, username, passwordHash, photoUrl, managerId }
    : { name, role, position, username, photoUrl, managerId };
  const [emp] = await db.update(employeesTable).set(setData).where(eq(employeesTable.id, id)).returning();
  if (!emp) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mapEmployee(emp));
});

router.delete("/employees/:id", async (req, res) => {
  const id = Number(req.params.id);
  const requesterRole = await getRequesterRole(req);
  if (requesterRole !== "Admin") {
    res.status(403).json({ error: "Chỉ quản trị viên mới có thể xóa tài khoản nhân viên" });
    return;
  }

  const [target] = await db.select({ isProtected: employeesTable.isProtected }).from(employeesTable).where(eq(employeesTable.id, id));
  if (!target) { res.status(404).json({ error: "Not found" }); return; }
  if (target.isProtected) {
    res.status(403).json({ error: "Không thể xóa tài khoản quản trị được bảo vệ" });
    return;
  }

  await db.delete(employeesTable).where(eq(employeesTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
