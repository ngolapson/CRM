import React, { createContext, useContext, useState, useEffect } from "react";
import { setEmployeeIdGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: number;
  name: string;
  role: string;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("crm_auth");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setEmployeeIdGetter(user ? () => String(user.id) : null);
    return () => setEmployeeIdGetter(null);
  }, [user]);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Đăng nhập thất bại");
    }
    const data: AuthUser = await res.json();
    setUser(data);
    localStorage.setItem("crm_auth", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("crm_auth");
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) throw new Error("Chưa đăng nhập");
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, oldPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Đổi mật khẩu thất bại");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
