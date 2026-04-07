import { useState } from "react";
import { loadConfig, formatPrice, formatZalo } from "@/lib/config";

const features = [
  { icon: "👥", title: "Quản lý khách hàng", desc: "Theo dõi toàn bộ lịch sử tương tác, trạng thái chăm sóc và thông tin chi tiết của từng khách hàng." },
  { icon: "📦", title: "Quản lý kho hàng", desc: "Theo dõi số lượng tồn kho theo thời gian thực, cảnh báo hàng sắp hết và lịch sử nhập hàng." },
  { icon: "🧾", title: "Quản lý đơn hàng", desc: "Tạo và theo dõi đơn hàng, doanh thu, lợi nhuận và bảo hành cho từng đơn hàng." },
  { icon: "📊", title: "Báo cáo & Thống kê", desc: "Biểu đồ trực quan về doanh thu, lợi nhuận, hiệu suất nhân viên và xu hướng kinh doanh." },
  { icon: "⚙️", title: "Vận hành nội bộ", desc: "Quản lý nhân viên, loại sản phẩm, nguồn khách hàng và toàn bộ danh mục hệ thống." },
  { icon: "🔒", title: "Bảo mật dữ liệu", desc: "Hệ thống đăng nhập riêng biệt, mỗi doanh nghiệp có subdomain và dữ liệu độc lập." },
];

type FormData = { name: string; phone: string; business: string; plan: string; note: string };

export default function LandingPage() {
  const cfg = loadConfig();
  const ZALO_LINK = `https://zalo.me/${cfg.zaloNumber}`;
  const fmtZalo = formatZalo(cfg.zaloNumber);

  const plans = [
    {
      name: "Cơ bản",
      monthly: cfg.planBasicMonthly,
      annual: cfg.planBasicAnnual,
      highlight: false,
      features: [
        "Quản lý đến 500 khách hàng",
        "Quản lý đơn hàng & kho",
        "Báo cáo cơ bản",
        "1 tài khoản nhân viên",
        "Hỗ trợ qua Zalo",
      ],
      cta: "Đăng ký dùng thử",
    },
    {
      name: "Chuyên nghiệp",
      monthly: cfg.planProMonthly,
      annual: cfg.planProAnnual,
      highlight: true,
      features: [
        "Quản lý không giới hạn khách hàng",
        "Quản lý đơn hàng & kho nâng cao",
        "Báo cáo đầy đủ & xuất Excel",
        "Đến 5 tài khoản nhân viên",
        "Hỗ trợ ưu tiên qua Zalo",
        "Subdomain riêng của bạn",
      ],
      cta: "Chọn gói này",
    },
    {
      name: "Doanh nghiệp",
      monthly: null,
      annual: null,
      highlight: false,
      features: [
        "Không giới hạn mọi tính năng",
        "Không giới hạn nhân viên",
        "Tùy chỉnh theo yêu cầu",
        "Đào tạo sử dụng trực tiếp",
        "Hỗ trợ 24/7",
        "SLA cam kết hoạt động",
      ],
      cta: "Tư vấn ngay",
    },
  ];

  const [form, setForm] = useState<FormData>({ name: "", phone: "", business: "", plan: "", note: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 900);
  }

  const heroLines = cfg.heroTitle.split("\n");

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">CRM</div>
            <span className="font-bold text-gray-900 text-lg">CRM Pro</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-gray-600 font-medium">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Tính năng</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">Bảng giá</a>
            <a href="#register" className="hover:text-emerald-600 transition-colors">Đăng ký</a>
          </div>
          <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Liên hệ Zalo
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        <div className="relative max-w-6xl mx-auto px-5 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            Phần mềm CRM dành cho doanh nghiệp Việt
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            {heroLines[0]}<br />
            <span className="text-emerald-200">{heroLines[1] || ""}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">{cfg.heroSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#register" className="bg-white text-emerald-700 font-bold px-8 py-3.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-lg text-base">
              Đăng ký dùng thử miễn phí
            </a>
            <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
              className="bg-white/10 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors text-base">
              Gọi / Zalo: {fmtZalo}
            </a>
          </div>
          <div className="mt-14 grid grid-cols-3 gap-6 max-w-md mx-auto text-center">
            <div><div className="text-3xl font-extrabold">500+</div><div className="text-white/70 text-sm mt-1">Doanh nghiệp tin dùng</div></div>
            <div><div className="text-3xl font-extrabold">99.9%</div><div className="text-white/70 text-sm mt-1">Uptime đảm bảo</div></div>
            <div><div className="text-3xl font-extrabold">5.0</div><div className="text-white/70 text-sm mt-1">Phiên bản mới nhất</div></div>
          </div>
        </div>
      </section>

      {/* TRIAL BANNER */}
      <section className="bg-emerald-50 border-y border-emerald-100 py-5 px-5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-lg">🎁</div>
            <div>
              <div className="font-bold text-emerald-800 text-sm">Dùng thử miễn phí 7 ngày — Không cần thẻ tín dụng</div>
              <div className="text-emerald-700 text-xs mt-0.5">
                Truy cập ngay:{" "}
                <a href={cfg.trialLink} target="_blank" rel="noopener noreferrer"
                  className="font-semibold underline hover:text-emerald-900">{cfg.trialLink}</a>
                {" "}· Tài khoản: <strong>{cfg.trialUsername}</strong> / Mật khẩu: <strong>{cfg.trialPassword}</strong>
              </div>
            </div>
          </div>
          <a href={cfg.trialLink} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 bg-emerald-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors">
            Dùng thử ngay
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-5 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Đầy đủ tính năng quản lý</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Mọi thứ bạn cần để vận hành và phát triển doanh nghiệp trong một phần mềm duy nhất.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              Tại sao chọn<br /><span className="text-emerald-600">CRM Pro?</span>
            </h2>
            <div className="space-y-5">
              {[
                { title: "Subdomain riêng — bảo mật tuyệt đối", desc: "Mỗi khách hàng có một địa chỉ riêng, dữ liệu hoàn toàn tách biệt." },
                { title: "Giao diện tiếng Việt 100%", desc: "Được thiết kế đặc biệt cho doanh nghiệp Việt Nam, không cần đào tạo phức tạp." },
                { title: "Triển khai ngay trong 24 giờ", desc: "Đăng ký hôm nay, hệ thống sẵn sàng sử dụng ngay ngày hôm sau." },
                { title: "Hỗ trợ tận tình qua Zalo", desc: "Đội ngũ hỗ trợ phản hồi nhanh, giải đáp mọi thắc mắc trong vài phút." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                    <div className="text-gray-500 text-sm mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100">
            <div className="space-y-4">
              {[
                { label: "Khách hàng", value: "1,247", trend: "+12%" },
                { label: "Doanh thu tháng này", value: "248.500.000đ", trend: "+8%" },
                { label: "Đơn hàng chờ xử lý", value: "34", trend: "" },
                { label: "Tỷ lệ chốt đơn", value: "67%", trend: "+5%" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{stat.value}</span>
                    {stat.trend && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stat.trend}</span>}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">Minh họa giao diện dashboard thực tế</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-5 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Bảng giá rõ ràng, không phí ẩn</h2>
            <p className="text-gray-500 text-lg">Thanh toán theo năm — tiết kiệm hơn so với thanh toán theo tháng</p>
          </div>

          {/* Pricing toggle label */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-3 bg-emerald-600 text-white text-sm font-semibold px-5 py-2 rounded-full shadow">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Giá theo năm — Đã giảm so với tháng
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-7 flex flex-col ${plan.highlight ? "bg-emerald-600 text-white shadow-2xl shadow-emerald-200 scale-105" : "bg-white border border-gray-200 text-gray-900"}`}>
                {plan.highlight && (
                  <div className="text-xs font-bold bg-white/20 text-white/90 rounded-full px-3 py-1 mb-4 w-fit">PHỔ BIẾN NHẤT</div>
                )}
                <div className={`text-lg font-bold mb-3 ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.name}</div>

                {plan.annual !== null ? (
                  <div className="mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                        {formatPrice(plan.annual)}đ
                      </span>
                      <span className={`text-sm ${plan.highlight ? "text-white/70" : "text-gray-500"}`}>/tháng</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-sm line-through ${plan.highlight ? "text-white/50" : "text-gray-400"}`}>
                        {formatPrice(plan.monthly!)}đ/tháng
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.highlight ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                        Tiết kiệm {Math.round((1 - plan.annual / plan.monthly!) * 100)}%
                      </span>
                    </div>
                    <div className={`text-xs mt-1 ${plan.highlight ? "text-white/60" : "text-gray-400"}`}>
                      Thanh toán {formatPrice(plan.annual * 12)}đ/năm
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <span className={`text-3xl font-extrabold ${plan.highlight ? "text-white" : "text-gray-900"}`}>Liên hệ</span>
                  </div>
                )}

                <ul className="space-y-3 mb-8 flex-1 mt-4">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-emerald-200" : "text-emerald-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.highlight ? "text-white/90" : "text-gray-600"}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <a href="#register" className={`text-center font-bold py-3 rounded-xl transition-colors text-sm ${plan.highlight ? "bg-white text-emerald-700 hover:bg-emerald-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            Tất cả gói đều có thể dùng thử miễn phí 7 ngày. Không cần thẻ tín dụng.
          </p>
        </div>
      </section>

      {/* REGISTER */}
      <section id="register" className="py-20 px-5 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Đăng ký dùng thử ngay</h2>
            <p className="text-gray-500 text-lg">Điền thông tin bên dưới, chúng tôi sẽ liên hệ qua Zalo trong vòng 30 phút.</p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-emerald-800 mb-2">Đăng ký thành công!</h3>
              <p className="text-emerald-700 mb-6">
                Cảm ơn <strong>{form.name}</strong>! Chúng tôi sẽ liên hệ qua Zalo số <strong>{form.phone}</strong> trong thời gian sớm nhất.
              </p>

              {/* Trial info box */}
              <div className="bg-white border border-emerald-200 rounded-xl p-5 mb-6 text-left">
                <div className="font-bold text-emerald-800 mb-3 text-center">Dùng thử ngay trong khi chờ!</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Link dùng thử:</span>
                    <a href={cfg.trialLink} target="_blank" rel="noopener noreferrer"
                      className="text-emerald-600 font-semibold hover:underline">{cfg.trialLink}</a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tài khoản:</span>
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{cfg.trialUsername}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mật khẩu:</span>
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{cfg.trialPassword}</span>
                  </div>
                </div>
              </div>

              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors">
                Nhắn Zalo ngay: {fmtZalo}
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ tên <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Nguyễn Văn A"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số Zalo / Điện thoại <span className="text-red-500">*</span></label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="0912 345 678"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên doanh nghiệp / cửa hàng</label>
                <input type="text" name="business" value={form.business} onChange={handleChange} placeholder="Công ty TNHH Ánh Dương"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gói dịch vụ quan tâm</label>
                <select name="plan" value={form.plan} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white">
                  <option value="">-- Chọn gói --</option>
                  <option value="basic">Cơ bản - {formatPrice(cfg.planBasicAnnual)}đ/tháng (theo năm)</option>
                  <option value="pro">Chuyên nghiệp - {formatPrice(cfg.planProAnnual)}đ/tháng (theo năm)</option>
                  <option value="enterprise">Doanh nghiệp - Liên hệ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ghi chú thêm</label>
                <textarea name="note" value={form.note} onChange={handleChange} rows={3} placeholder="Ngành hàng, số lượng nhân viên, yêu cầu đặc biệt..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors text-base disabled:opacity-70">
                {loading ? "Đang gửi..." : "Gửi đăng ký ngay"}
              </button>
              <p className="text-center text-sm text-gray-500">
                Hoặc nhắn trực tiếp qua{" "}
                <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold hover:underline">
                  Zalo: {fmtZalo}
                </a>
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">CRM</div>
            <span className="font-bold text-base">CRM Pro</span>
            <span className="text-gray-500 text-sm">- Phần mềm Quản lý Khách hàng</span>
          </div>
          <div className="text-sm text-gray-400">
            Hỗ trợ:{" "}
            <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Zalo {fmtZalo}</a>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">© {new Date().getFullYear()} CRM Pro. All rights reserved.</div>
            <a href="/landing/admin" className="text-gray-700 hover:text-gray-500 text-xs transition-colors">Quản trị</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
