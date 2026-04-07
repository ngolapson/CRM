import { useState, useEffect } from "react";
import { loadConfig, saveConfig, DEFAULT_CONFIG, formatZalo, type SiteConfig } from "@/lib/config";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [cfg, setCfg] = useState<SiteConfig>(loadConfig());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "trial" | "security">("general");

  useEffect(() => {
    const auth = sessionStorage.getItem("crmpro_admin_auth");
    if (auth === "1") setLoggedIn(true);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const currentCfg = loadConfig();
    if (pw === currentCfg.adminPassword) {
      sessionStorage.setItem("crmpro_admin_auth", "1");
      setLoggedIn(true);
      setPwError("");
    } else {
      setPwError("Mật khẩu không đúng");
    }
  }

  function handleSave() {
    saveConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    if (!confirm("Bạn có chắc muốn khôi phục về cài đặt mặc định?")) return;
    setCfg(DEFAULT_CONFIG);
    saveConfig(DEFAULT_CONFIG);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleLogout() {
    sessionStorage.removeItem("crmpro_admin_auth");
    setLoggedIn(false);
  }

  function set<K extends keyof SiteConfig>(key: K, val: SiteConfig[K]) {
    setCfg(prev => ({ ...prev, [key]: val }));
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-5">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
              CRM
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">Quản trị viên</h1>
            <p className="text-gray-500 text-sm mt-1">Đăng nhập để chỉnh sửa nội dung trang</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu quản trị</label>
              <input
                type="password"
                value={pw}
                onChange={e => { setPw(e.target.value); setPwError(""); }}
                placeholder="Nhập mật khẩu..."
                autoFocus
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {pwError && <p className="text-red-500 text-xs mt-1.5">{pwError}</p>}
            </div>
            <button type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors">
              Đăng nhập
            </button>
          </form>
          <div className="mt-5 text-center">
            <a href="/landing/" className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">
              ← Quay về trang chính
            </a>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "general", label: "Thông tin chung" },
    { key: "pricing", label: "Bảng giá" },
    { key: "trial", label: "Dùng thử" },
    { key: "security", label: "Bảo mật" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">CRM</div>
          <div>
            <span className="font-bold">CRM Pro</span>
            <span className="text-gray-400 text-sm ml-2">— Bảng quản trị nội dung</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/landing/" target="_blank" rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors">
            Xem trang →
          </a>
          <button onClick={handleLogout}
            className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Chỉnh sửa nội dung trang</h1>
            <p className="text-gray-500 text-sm mt-1">Mọi thay đổi sẽ được lưu vào trình duyệt và áp dụng ngay lập tức.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReset}
              className="text-sm border border-gray-300 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">
              Khôi phục mặc định
            </button>
            <button onClick={handleSave}
              className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors flex items-center gap-2">
              {saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Đã lưu!
                </>
              ) : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${activeTab === tab.key ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-7 space-y-6">
          {/* GENERAL */}
          {activeTab === "general" && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Số Zalo / Điện thoại hỗ trợ</label>
                <input type="text" value={cfg.zaloNumber} onChange={e => set("zaloNumber", e.target.value)}
                  placeholder="0888016168"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {cfg.zaloNumber && (
                  <p className="text-gray-400 text-xs mt-1">Hiển thị: {formatZalo(cfg.zaloNumber)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề trang chủ (Hero)</label>
                <p className="text-xs text-gray-400 mb-2">Dùng ký tự xuống dòng (Enter) để chia 2 dòng. Dòng 2 sẽ hiển thị màu xanh nhạt.</p>
                <textarea value={cfg.heroTitle} onChange={e => set("heroTitle", e.target.value)} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả phụ dưới tiêu đề</label>
                <textarea value={cfg.heroSubtitle} onChange={e => set("heroSubtitle", e.target.value)} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
            </>
          )}

          {/* PRICING */}
          {activeTab === "pricing" && (
            <>
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4 text-sm text-blue-700">
                Giá hiển thị theo năm. Nhập giá gốc (tháng) và giá khuyến mãi (năm) — hệ thống tự tính % tiết kiệm.
              </div>
              <div>
                <div className="font-bold text-gray-900 mb-4 text-base">Gói Cơ bản</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá gốc (đ/tháng)</label>
                    <input type="number" value={cfg.planBasicMonthly} onChange={e => set("planBasicMonthly", Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá theo năm (đ/tháng)</label>
                    <input type="number" value={cfg.planBasicAnnual} onChange={e => set("planBasicAnnual", Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                {cfg.planBasicMonthly > 0 && cfg.planBasicAnnual > 0 && (
                  <p className="text-emerald-600 text-xs mt-2">
                    Khách tiết kiệm {Math.round((1 - cfg.planBasicAnnual / cfg.planBasicMonthly) * 100)}% · Thanh toán {(cfg.planBasicAnnual * 12).toLocaleString("vi-VN")}đ/năm
                  </p>
                )}
              </div>
              <div className="border-t border-gray-100 pt-6">
                <div className="font-bold text-gray-900 mb-4 text-base">Gói Chuyên nghiệp</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá gốc (đ/tháng)</label>
                    <input type="number" value={cfg.planProMonthly} onChange={e => set("planProMonthly", Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá theo năm (đ/tháng)</label>
                    <input type="number" value={cfg.planProAnnual} onChange={e => set("planProAnnual", Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                {cfg.planProMonthly > 0 && cfg.planProAnnual > 0 && (
                  <p className="text-emerald-600 text-xs mt-2">
                    Khách tiết kiệm {Math.round((1 - cfg.planProAnnual / cfg.planProMonthly) * 100)}% · Thanh toán {(cfg.planProAnnual * 12).toLocaleString("vi-VN")}đ/năm
                  </p>
                )}
              </div>
            </>
          )}

          {/* TRIAL */}
          {activeTab === "trial" && (
            <>
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-5 py-4 text-sm text-amber-700">
                Thông tin này hiển thị trên banner dùng thử và trong hộp thông báo sau khi khách đăng ký.
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Link dùng thử (URL)</label>
                <input type="url" value={cfg.trialLink} onChange={e => set("trialLink", e.target.value)}
                  placeholder="https://crmpro.replit.app"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tài khoản dùng thử</label>
                  <input type="text" value={cfg.trialUsername} onChange={e => set("trialUsername", e.target.value)}
                    placeholder="demo"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu dùng thử</label>
                  <input type="text" value={cfg.trialPassword} onChange={e => set("trialPassword", e.target.value)}
                    placeholder="demo123"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              {/* Preview */}
              <div className="border border-dashed border-gray-200 rounded-xl p-5 bg-gray-50">
                <div className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">Xem trước thông báo</div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Link dùng thử:</span>
                    <span className="text-emerald-600 font-semibold">{cfg.trialLink || "(chưa điền)"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tài khoản:</span>
                    <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded">{cfg.trialUsername || "(chưa điền)"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mật khẩu:</span>
                    <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded">{cfg.trialPassword || "(chưa điền)"}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECURITY */}
          {activeTab === "security" && (
            <>
              <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-700">
                Đổi mật khẩu quản trị tại đây. Sau khi lưu, mật khẩu cũ sẽ không còn hoạt động.
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu quản trị mới</label>
                <input type="password" value={cfg.adminPassword} onChange={e => set("adminPassword", e.target.value)}
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <p className="text-gray-400 text-xs mt-2">Mật khẩu hiện tại: <span className="font-mono">{cfg.adminPassword}</span></p>
              </div>
            </>
          )}
        </div>

        {/* Save button bottom */}
        <div className="mt-6 flex justify-end">
          <button onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Đã lưu thành công!
              </>
            ) : "Lưu tất cả thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
