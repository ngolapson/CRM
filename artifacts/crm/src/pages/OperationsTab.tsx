import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetTodayStats, useGetSalesTrend } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Plus, Package, FileText, ArrowRight } from "lucide-react";

export function OperationsTab() {
  const { data: stats, isLoading: isLoadingStats } = useGetTodayStats();
  const { data: trend, isLoading: isLoadingTrend } = useGetSalesTrend();

  return (
    <MainLayout activeTab="van-hanh">
      <div className="flex flex-col gap-6">
        <div className="flex gap-2 bg-muted/50 p-1 rounded-lg w-fit">
          <Button variant="default" size="sm" className="rounded-md">Hôm nay</Button>
          <Button variant="ghost" size="sm" className="rounded-md text-muted-foreground">Bán hàng</Button>
          <Button variant="ghost" size="sm" className="rounded-md text-muted-foreground">Lãi lỗ</Button>
          <Button variant="ghost" size="sm" className="rounded-md text-muted-foreground">Kho hàng</Button>
          <Button variant="ghost" size="sm" className="rounded-md text-muted-foreground">Bảo hành</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu hôm nay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {isLoadingStats ? "..." : `${formatCurrency(stats?.todayRevenue)} đ`}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Số đơn hôm nay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats?.todayOrders}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lợi nhuận hôm nay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {isLoadingStats ? "..." : `${formatCurrency(stats?.todayProfit)} đ`}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Xu hướng bán hàng (7 ngày)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoadingTrend ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Đang tải biểu đồ...</div>
                ) : trend && trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(val) => {
                        try {
                          const [y, m, d] = val.split("-");
                          return `${d}/${m}`;
                        } catch(e) { return val; }
                      }} tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                      <YAxis tickFormatter={(val) => `${val / 1000000}M`} tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                      <Tooltip formatter={(value: number) => [`${formatCurrency(value)} đ`, "Doanh thu"]} />
                      <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-primary)" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Không có dữ liệu</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button className="w-full justify-start h-12" variant="default">
                <Plus className="w-5 h-5 mr-3 opacity-80" />
                <span className="font-semibold text-base">+ Tạo đơn mới</span>
              </Button>
              <Button className="w-full justify-start h-12" variant="outline">
                <Package className="w-5 h-5 mr-3 text-muted-foreground" />
                <span className="font-medium">Nhập kho</span>
              </Button>
              <Button className="w-full justify-start h-12" variant="outline">
                <Package className="w-5 h-5 mr-3 text-muted-foreground" />
                <span className="font-medium">Xem kho hàng</span>
              </Button>
              <Button className="w-full justify-start h-12" variant="outline">
                <FileText className="w-5 h-5 mr-3 text-muted-foreground" />
                <span className="font-medium">Xem báo cáo chi tiết</span>
                <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
