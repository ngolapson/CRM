import { Router } from "express";
import { db } from "@workspace/db";
import { employeesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Thiếu tên đăng nhập hoặc mật khẩu" });
    return;
  }

  try {
    const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.username, username));
    if (!employee || !employee.passwordHash) {
      res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
      return;
    }

    const valid = await bcrypt.compare(password, employee.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
      return;
    }

    res.json({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      username: employee.username,
    });
  } catch {
    res.status(500).json({ error: "Lỗi hệ thống" });
  }
});

router.post("/auth/change-password", async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    res.status(400).json({ error: "Thiếu thông tin" });
    return;
  }

  try {
    const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, userId));
    if (!employee || !employee.passwordHash) {
      res.status(401).json({ error: "Tài khoản không hợp lệ" });
      return;
    }

    const valid = await bcrypt.compare(oldPassword, employee.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Mật khẩu hiện tại không đúng" });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(employeesTable).set({ passwordHash: newHash }).where(eq(employeesTable.id, userId));

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Lỗi hệ thống" });
  }
});

export default router;
