export type SiteConfig = {
  zaloNumber: string;
  trialLink: string;
  trialUsername: string;
  trialPassword: string;
  heroTitle: string;
  heroSubtitle: string;
  planBasicMonthly: number;
  planBasicAnnual: number;
  planProMonthly: number;
  planProAnnual: number;
  adminPassword: string;
};

export const DEFAULT_CONFIG: SiteConfig = {
  zaloNumber: "0888016168",
  trialLink: "https://crmpro.replit.app",
  trialUsername: "demo",
  trialPassword: "demo123",
  heroTitle: "Quản lý khách hàng\nthông minh & hiệu quả",
  heroSubtitle:
    "CRM Pro giúp doanh nghiệp theo dõi khách hàng, quản lý đơn hàng, kho hàng và báo cáo doanh thu — tất cả trong một nền tảng, truy cập từ mọi thiết bị.",
  planBasicMonthly: 99000,
  planBasicAnnual: 69000,
  planProMonthly: 199000,
  planProAnnual: 139000,
  adminPassword: "admin2024",
};

const STORAGE_KEY = "crmpro_site_config";

export function loadConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: SiteConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function formatPrice(n: number): string {
  return n.toLocaleString("vi-VN");
}

export function formatZalo(n: string): string {
  return n.replace(/(\d{4})(\d{3})(\d{3})/, "$1.$2.$3");
}
