import { Router } from "express";
import { db } from "@workspace/db";
import { employeesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/employees", async (req, res) => {
  const employees = await db.select().from(employeesTable).orderBy(employeesTable.id);
  res.json(employees.map(e => ({
    id: e.id,
    name: e.name,
    role: e.role,
    isProtected: e.isProtected,
    createdAt: e.createdAt?.toISOString(),
  })));
});

router.post("/employees", async (req, res) => {
  const { name, role = "Admin" } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const [emp] = await db.insert(employeesTable).values({ name, role }).returning();
  res.status(201).json({
    id: emp.id,
    name: emp.name,
    role: emp.role,
    isProtected: emp.isProtected,
    createdAt: emp.createdAt?.toISOString(),
  });
});

router.put("/employees/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, role = "Admin" } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const [emp] = await db.update(employeesTable).set({ name, role }).where(eq(employeesTable.id, id)).returning();
  if (!emp) return res.status(404).json({ error: "Not found" });
  res.json({
    id: emp.id,
    name: emp.name,
    role: emp.role,
    isProtected: emp.isProtected,
    createdAt: emp.createdAt?.toISOString(),
  });
});

router.delete("/employees/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(employeesTable).where(eq(employeesTable.id, id));
  res.json({ success: true, message: "Deleted" });
});

export default router;
