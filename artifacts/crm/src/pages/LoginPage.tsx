import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, LogIn } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Quản lý chăm sóc khách hàng</h1>
          <p className="text-muted-foreground text-sm mt-1">Version 5.0</p>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-semibold">Đăng nhập hệ thống</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Tên đăng nhập <span className="text-destructive">*</span>
              </Label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                autoFocus
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Mật khẩu <span className="text-destructive">*</span>
              </Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10"
              disabled={loading}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
