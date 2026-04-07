import React from "react";
import { Link, useLocation } from "wouter";
import { Users, BarChart3, Settings, Wrench, Package, ArrowRight, LogOut, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetInventorySummary } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";

type TabValue = "khach-hang" | "bao-cao" | "van-hanh" | "cai-dat";

export function MainLayout({ children, activeTab }: { children: React.ReactNode, activeTab: TabValue }) {
  const [location, setLocation] = useLocation();
  const { data: inventoryData } = useGetInventorySummary();

  const handleTabClick = (tab: TabValue) => {
    setLocation(`/${tab === "khach-hang" ? "" : tab}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-border shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="font-medium text-sm">Administrator</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium" data-testid="button-change-password">
              <KeyRound className="w-3.5 h-3.5 mr-1" />
              Đổi mật khẩu
            </Button>
            <Button variant="destructive" size="sm" className="h-8 text-xs font-medium" data-testid="button-logout">
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Đăng xuất
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <h1 className="text-xl font-bold text-primary flex items-baseline gap-2">
            Quản lý chăm sóc khách hàng
            <span className="text-xs font-normal text-muted-foreground">(Version: 5.0)</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Theo dõi và chăm sóc từng khách hàng một cách hiệu quả</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white px-6 pt-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TabButton 
            active={activeTab === "khach-hang"} 
            onClick={() => handleTabClick("khach-hang")}
            icon={<Users className="w-4 h-4" />}
            label="Khách hàng"
            testId="tab-khach-hang"
          />
          <TabButton 
            active={activeTab === "bao-cao"} 
            onClick={() => handleTabClick("bao-cao")}
            icon={<BarChart3 className="w-4 h-4" />}
            label="Báo cáo"
            testId="tab-bao-cao"
          />
          <TabButton 
            active={activeTab === "van-hanh"} 
            onClick={() => handleTabClick("van-hanh")}
            icon={<Settings className="w-4 h-4" />}
            label="Vận hành"
            testId="tab-van-hanh"
          />
          <TabButton 
            active={activeTab === "cai-dat"} 
            onClick={() => handleTabClick("cai-dat")}
            icon={<Wrench className="w-4 h-4" />}
            label="Cài đặt"
            testId="tab-cai-dat"
          />
        </div>
      </div>

      {/* Warning Banners */}
      {inventoryData && (
        <div className="px-6 py-3 flex flex-col gap-2 bg-yellow-50/50 border-b border-yellow-100">
          <div className="flex items-center justify-between bg-yellow-100/50 text-yellow-800 px-4 py-2 rounded-md text-sm border border-yellow-200">
            <div className="flex items-center gap-2 font-medium">
              <Package className="w-4 h-4 text-yellow-600" />
              <span>
                Vốn tồn kho: <span className="font-bold text-yellow-900">{formatCurrency(inventoryData.totalCapital)} đ</span> 
                <span className="mx-2 text-yellow-400">|</span>
                Tồn &gt; 30 ngày: <span className="font-bold">{inventoryData.above30Days}</span>
                <span className="mx-2 text-yellow-400">|</span>
                &gt; 60 ngày: <span className="font-bold">{inventoryData.above60Days}</span>
                <span className="mx-2 text-yellow-400">|</span>
                &gt; 90 ngày: <span className="font-bold">{inventoryData.above90Days}</span>
              </span>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs bg-white hover:bg-yellow-50 text-yellow-700 border-yellow-300">
              Xem kho hàng
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between bg-orange-100/50 text-orange-800 px-4 py-2 rounded-md text-sm border border-orange-200">
            <div className="flex items-center gap-2 font-medium">
              <Package className="w-4 h-4 text-orange-600" />
              <span>
                Sản phẩm sắp hết hàng (tồn &lt; 5): <span className="font-bold text-orange-900">{inventoryData.lowStock} sản phẩm</span>
              </span>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs bg-white hover:bg-orange-50 text-orange-700 border-orange-300">
              Quản lý sản phẩm & kho
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  icon, 
  label,
  testId
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  testId: string;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2
        ${active 
          ? "bg-primary/5 text-primary border-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"}
      `}
    >
      {icon}
      {label}
    </button>
  );
}