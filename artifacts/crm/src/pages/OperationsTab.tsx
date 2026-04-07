import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useGetTodayStats, useGetSalesTrend, useGetInventorySummary,
  useGetExpiringWarranties, useGetExpiredWarranties,
  useGetMonthlyProfit, useGetMonthlyTrend, useGetTopSales,
  useListProducts, useListStockReceipts, useCreateStockReceipt,
  getListProductsQueryKey, getListStockReceiptsQueryKey,
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Bar, BarChart, Area, AreaChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Package, TrendingUp, DollarSign, Shield, AlertTriangle, Plus, FileText, ArrowRight, PackagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type SubTab = "hom-nay" | "ban-hang" | "lai-lo" | "kho-hang" | "bao-hanh";

export function OperationsTab() {
  const search = useSearch();
  const initialTab = (new URLSearchParams(search).get("tab") as SubTab) || "hom-nay";
  const [activeTab, setActiveTab] = useState<SubTab>(initialTab);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const tab = (new URLSearchParams(search).get("tab") as SubTab);
    if (tab) setActiveTab(tab);
  }, [search]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: isLoadingStats } = useGetTodayStats();
  const { data: trend, isLoading: isLoadingTrend } = useGetSalesTrend();
  const { data: inventory } = useGetInventorySummary();
  const { data: expiringWarranties } = useGetExpiringWarranties({ days: 30 });
  const { data: expiredWarranties } = useGetExpiredWarranties();
  const { data: monthlyProfit } = useGetMonthlyProfit();
  const { data: monthlyTrend } = useGetMonthlyTrend();
  const { data: topSales } = useGetTopSales();
  const { data: products } = useListProducts();
  const { data: stockReceipts } = useListStockReceipts();
  const createStockReceipt = useCreateStockReceipt();

  const [importOpen, setImportOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [importData, setImportData] = useState({ quantity: "", importDate: new Date().toISOString().split("T")[0], note: "" });
  const [warrantySearch, setWarrantySearch] = useState("");

  const tabs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: "hom-nay", label: "Hôm nay", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "ban-hang", label: "Bán hàng", icon: <DollarSign className="w-4 h-4" /> },
    { id: "lai-lo", label: "Lãi lỗ", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "kho-hang", label: "Kho hàng", icon: <Package className="w-4 h-4" /> },
    { id: "bao-hanh", label: "Bảo hành", icon: <Shield className="w-4 h-4" /> },
  ];

  const handleImportStock = async () => {
    if (!selectedProductId || !importData.quantity || !importData.importDate) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" }); return;
    }
    try {
      await createStockReceipt.mutateAsync({
        data: {
          productId: Number(selectedProductId),
          quantity: Number(importData.quantity),
          importDate: importData.importDate,
          note: importData.note || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListStockReceiptsQueryKey() });
      setImportOpen(false);
      setSelectedProductId("");
      setImportData({ quantity: "", importDate: new Date().toISOString().split("T")[0], note: "" });
      toast({ title: "Đã nhập kho thành công" });
    } catch {
      toast({ title: "Lỗi khi nhập kho", variant: "destructive" });
    }
  };

  const selectedProduct = products?.find(p => p.id === Number(selectedProductId));

  const allWarranties = [...(expiringWarranties ?? []), ...(expiredWarranties ?? [])];
  const filteredWarranties = warrantySearch
    ? allWarranties.filter(w =>
        w.customerName.toLowerCase().includes(warrantySearch.toLowerCase()) ||
        w.phone.includes(warrantySearch) ||
        (w.warrantyCode ?? "").toLowerCase().includes(warrantySearch.toLowerCase())
      )
    : allWarranties;

  const totalProfit = monthlyProfit?.reduce((s, m) => s + (m.profit || 0), 0) ?? 0;
  const avgProfit = monthlyProfit && monthlyProfit.length > 0 ? totalProfit / monthlyProfit.length : 0;
  const bestMonth = monthlyProfit && monthlyProfit.length > 0
    ? monthlyProfit.reduce((best, m) => m.profit > best.profit ? m : best).month
    : "-";

  return (
    <MainLayout activeTab="van-hanh">
      <div className="flex flex-col gap-6">
        {/* Sub-tab Nav */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit border border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== HÔM NAY ===== */}
        {activeTab === "hom-nay" && (
          <div className="flex flex-col gap-6">
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
                  <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats?.todayOrders ?? 0}</div>
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
                  <CardTitle className="text-base font-semibold">Xu hướng bán hàng (7 ngày gần nhất)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    {isLoadingTrend ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">Đang tải...</div>
                    ) : trend && trend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tickFormatter={(val) => { const [,m,d] = val.split("-"); return `${d}/${m}`; }} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                          <YAxis tickFormatter={(val) => `${val / 1000000}M`} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                          <Tooltip formatter={(value: number) => [`${formatCurrency(value)} đ`, "Doanh thu"]} labelFormatter={(label) => { const [y,m,d] = label.split("-"); return `Ngày ${d}/${m}/${y}`; }} />
                          <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRevenue)" dot={{ r: 4, fill: "#6366f1" }} activeDot={{ r: 6 }} />
                        </AreaChart>
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
                  <Button className="w-full justify-start h-12" variant="default" onClick={() => setLocation("/?open=add")}>
                    <Plus className="w-5 h-5 mr-3 opacity-80" />
                    <span className="font-semibold">+ Tạo đơn mới</span>
                  </Button>
                  <Button className="w-full justify-start h-12" variant="outline" onClick={() => setImportOpen(true)}>
                    <PackagePlus className="w-5 h-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Nhập kho</span>
                  </Button>
                  <Button className="w-full justify-start h-12" variant="outline" onClick={() => setActiveTab("kho-hang")}>
                    <Package className="w-5 h-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Xem kho hàng</span>
                  </Button>
                  <Button className="w-full justify-start h-12" variant="outline" onClick={() => setLocation("/bao-cao")}>
                    <FileText className="w-5 h-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Báo cáo chi tiết</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ===== BÁN HÀNG ===== */}
        {activeTab === "ban-hang" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Xu hướng đơn hàng theo tháng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    {monthlyTrend && monthlyTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                          <YAxis tickLine={false} axisLine={false} fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="newCustomers" name="Khách mới" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="closedOrders" name="Đơn chốt" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">Không có dữ liệu</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Top nhân viên bán hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topSales && topSales.length > 0 ? topSales.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                          <div className="font-medium">{item.employeeName}</div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{item.closedCount} đơn</span>
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">{(item.closeRate * 100).toFixed(0)}% chốt</Badge>
                        </div>
                      </div>
                    )) : (
                      <div className="h-40 flex items-center justify-center text-muted-foreground">Không có dữ liệu</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ===== LÃI LỖ ===== */}
        {activeTab === "lai-lo" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tổng lợi nhuận</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalProfit)} đ</div>
                  <p className="text-xs text-muted-foreground mt-1">Tất cả các tháng</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Lợi nhuận TB/tháng</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(avgProfit)} đ</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tháng lợi nhuận cao nhất</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bestMonth}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Lợi nhuận theo tháng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {monthlyProfit && monthlyProfit.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyProfit} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        <YAxis tickFormatter={(val) => `${val / 1000000}M`} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        <Tooltip formatter={(value: number) => [`${formatCurrency(value)} đ`, "Lợi nhuận"]} />
                        <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#colorProfit)" dot={{ r: 4, fill: "#10b981" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">Không có dữ liệu</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== KHO HÀNG ===== */}
        {activeTab === "kho-hang" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Vốn tồn kho</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(inventory?.totalCapital ?? 0)} đ</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Tồn &gt; 30 ngày</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-amber-600">{inventory?.above30Days ?? 0} SP</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> Tồn &gt; 60 ngày</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-orange-600">{inventory?.above60Days ?? 0} SP</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Tồn &gt; 90 ngày</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">{inventory?.above90Days ?? 0} SP</div></CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold">Danh sách sản phẩm trong kho</h3>
              <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setImportOpen(true)}>
                <PackagePlus className="w-4 h-4 mr-2" /> Nhập kho
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Nguồn</TableHead>
                      <TableHead className="text-right">Tồn kho</TableHead>
                      <TableHead className="text-right">Giá vốn</TableHead>
                      <TableHead className="text-right">Giá bán</TableHead>
                      <TableHead className="text-center">Bảo hành</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products && products.length > 0 ? products.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.productTypeName ?? "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.supplySourceName ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={p.quantity <= 0 ? "destructive" : p.quantity <= 5 ? "outline" : "secondary"} className={p.quantity > 5 ? "" : p.quantity <= 0 ? "" : "border-amber-400 text-amber-700"}>
                            {p.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(p.costPrice)} đ</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(p.sellPrice)} đ</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{p.warrantyMonths ? `${p.warrantyMonths} tháng` : "-"}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Không có sản phẩm nào</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {stockReceipts && stockReceipts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Lịch sử nhập kho gần đây</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">SL nhập</TableHead>
                        <TableHead>Ngày nhập</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockReceipts.slice(0, 10).map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.productName ?? "-"}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="text-emerald-700 bg-emerald-50">+{r.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{r.importDate ? formatDate(r.importDate) : "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.note ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ===== BẢO HÀNH ===== */}
        {activeTab === "bao-hanh" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Tìm theo tên, SĐT, mã bảo hành..."
                value={warrantySearch}
                onChange={e => setWarrantySearch(e.target.value)}
                className="max-w-sm"
              />
              <div className="text-sm text-muted-foreground">
                {expiringWarranties?.length ?? 0} sắp hết hạn &bull; {expiredWarranties?.length ?? 0} đã hết hạn
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Bảo hành sắp hết hạn (30 ngày)
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 ml-auto">{expiringWarranties?.length ?? 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>SĐT</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Mã BH</TableHead>
                        <TableHead>Hết hạn</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiringWarranties && expiringWarranties.length > 0 ? expiringWarranties
                        .filter(w => !warrantySearch || w.customerName.toLowerCase().includes(warrantySearch.toLowerCase()) || w.phone.includes(warrantySearch) || (w.warrantyCode ?? "").includes(warrantySearch))
                        .map(w => (
                          <TableRow key={w.orderId}>
                            <TableCell className="font-medium">{w.customerName}</TableCell>
                            <TableCell className="text-sm">{w.phone}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{w.customProductName ?? w.productTypeName ?? w.supplySourceName ?? "-"}</TableCell>
                            <TableCell className="text-sm font-mono text-muted-foreground">{w.warrantyCode ?? "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-amber-400 text-amber-700">
                                {formatDate(w.warrantyExpiry)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">Không có bảo hành sắp hết hạn</TableCell></TableRow>
                        )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Bảo hành đã hết hạn
                    <Badge variant="destructive" className="ml-auto text-xs">{expiredWarranties?.length ?? 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>SĐT</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Mã BH</TableHead>
                        <TableHead>Hết hạn</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiredWarranties && expiredWarranties.length > 0 ? expiredWarranties
                        .filter(w => !warrantySearch || w.customerName.toLowerCase().includes(warrantySearch.toLowerCase()) || w.phone.includes(warrantySearch) || (w.warrantyCode ?? "").includes(warrantySearch))
                        .map(w => (
                          <TableRow key={w.orderId}>
                            <TableCell className="font-medium">{w.customerName}</TableCell>
                            <TableCell className="text-sm">{w.phone}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{w.customProductName ?? w.productTypeName ?? w.supplySourceName ?? "-"}</TableCell>
                            <TableCell className="text-sm font-mono text-muted-foreground">{w.warrantyCode ?? "-"}</TableCell>
                            <TableCell>
                              <Badge variant="destructive" className="text-xs">
                                {formatDate(w.warrantyExpiry)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">Không có bảo hành hết hạn</TableCell></TableRow>
                        )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Import Stock Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-emerald-600" />
              Nhập kho
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Chọn sản phẩm *</Label>
                <button
                  type="button"
                  className="text-xs text-emerald-600 hover:text-emerald-700 underline"
                  onClick={() => { setImportOpen(false); setLocation("/cai-dat?section=products"); }}
                >
                  + Thêm sản phẩm mới
                </button>
              </div>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sản phẩm..." />
                </SelectTrigger>
                <SelectContent>
                  {products && products.length > 0 ? products.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} (tồn: {p.quantity})
                    </SelectItem>
                  )) : (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Chưa có sản phẩm nào.{" "}
                      <button
                        className="text-emerald-600 underline"
                        onClick={() => { setImportOpen(false); setLocation("/cai-dat?section=products"); }}
                      >
                        Thêm ngay
                      </button>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedProduct && (
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <div className="font-medium">{selectedProduct.name}</div>
                <div className="text-muted-foreground mt-0.5">Tồn kho hiện tại: {selectedProduct.quantity} sản phẩm</div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Số lượng nhập *</Label>
              <Input type="number" min="1" value={importData.quantity} onChange={e => setImportData({ ...importData, quantity: e.target.value })} placeholder="Nhập số lượng..." />
            </div>
            <div className="space-y-1.5">
              <Label>Ngày nhập *</Label>
              <Input type="date" value={importData.importDate} onChange={e => setImportData({ ...importData, importDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input value={importData.note} onChange={e => setImportData({ ...importData, note: e.target.value })} placeholder="Ghi chú nhập kho..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Hủy</Button>
            <Button onClick={handleImportStock} disabled={createStockReceipt.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              <PackagePlus className="w-4 h-4 mr-2" />
              {createStockReceipt.isPending ? "Đang nhập..." : "Xác nhận nhập kho"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
