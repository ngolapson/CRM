import { useState, useEffect, useCallback } from "react";
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
  useGetTodayStats, useGetSalesTrend,
  useGetMonthlyProfit, useGetMonthlyTrend, useGetTopSales,
  useGetSalesMonthly, useGetProfitLoss, useGetInventoryDetail, useGetActiveWarranty,
  useGetInventorySummary,
  useListProducts, useListSupplySources, useListProductTypes,
  useListStockReceipts, useCreateStockReceipt, useDeleteProduct, useUpdateProduct,
  getListProductsQueryKey, getListStockReceiptsQueryKey, getGetInventoryDetailQueryKey, getGetInventorySummaryQueryKey,
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Bar, BarChart, Line, LineChart, Area, AreaChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Package, TrendingUp, DollarSign, Shield, AlertTriangle, Plus, FileText, ArrowRight, PackagePlus, Laptop, FileDown, Users, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";

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
  const { data: salesMonthly } = useGetSalesMonthly();
  const { data: profitLoss } = useGetProfitLoss();
  const { data: inventoryDetail } = useGetInventoryDetail();
  const { data: inventory } = useGetInventorySummary();
  const { data: activeWarranties } = useGetActiveWarranty();
  const { data: monthlyTrend } = useGetMonthlyTrend();
  const { data: topSales } = useGetTopSales();
  const { data: products } = useListProducts();
  const { data: supplySources } = useListSupplySources();
  const { data: productTypes } = useListProductTypes();
  const { data: stockReceipts } = useListStockReceipts();
  const createStockReceipt = useCreateStockReceipt();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const [importOpen, setImportOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editProductData, setEditProductData] = useState<{
    id: number; name: string; sellPrice: string; costPrice: string; note: string;
    quantity: number; productTypeId?: number | null; supplySourceId?: number | null; warrantyMonths?: number | null;
  } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [importData, setImportData] = useState({ quantity: "", importDate: new Date().toISOString().split("T")[0], note: "" });
  const [warrantySearch, setWarrantySearch] = useState("");
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState("__all__");
  const [inventorySourceFilter, setInventorySourceFilter] = useState("__all__");

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

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Xóa sản phẩm "${name}"?`)) return;
    try {
      await deleteProduct.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetInventoryDetailQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
      toast({ title: `Đã xóa sản phẩm ${name}` });
    } catch {
      toast({ title: "Không thể xóa sản phẩm", variant: "destructive" });
    }
  };

  const handleEditProductSave = async () => {
    if (!editProductData) return;
    try {
      await updateProduct.mutateAsync({
        id: editProductData.id,
        data: {
          name: editProductData.name,
          sellPrice: Number(editProductData.sellPrice) || 0,
          costPrice: Number(editProductData.costPrice) || 0,
          note: editProductData.note || undefined,
          quantity: editProductData.quantity,
          productTypeId: editProductData.productTypeId ?? undefined,
          supplySourceId: editProductData.supplySourceId ?? undefined,
          warrantyMonths: editProductData.warrantyMonths ?? undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetInventoryDetailQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetInventorySummaryQueryKey() });
      setEditProductOpen(false);
      setEditProductData(null);
      toast({ title: "Đã lưu sản phẩm" });
    } catch {
      toast({ title: "Lỗi khi lưu sản phẩm", variant: "destructive" });
    }
  };

  const selectedProduct = products?.find(p => p.id === Number(selectedProductId));

  const filteredWarranties = activeWarranties?.filter(w => {
    if (!warrantySearch) return true;
    const s = warrantySearch.toLowerCase();
    return (
      w.customerName.toLowerCase().includes(s) ||
      w.customerPhone.includes(s) ||
      (w.orderCode ?? "").toLowerCase().includes(s) ||
      (w.customProductName ?? "").toLowerCase().includes(s) ||
      (w.productTypeName ?? "").toLowerCase().includes(s) ||
      (w.supplySourceName ?? "").toLowerCase().includes(s)
    );
  }) ?? [];

  const filteredInventory = inventoryDetail?.filter(p => {
    const matchType = inventoryTypeFilter === "__all__" || String(p.productTypeId) === inventoryTypeFilter;
    const matchSource = inventorySourceFilter === "__all__" || String(p.supplySourceId) === inventorySourceFilter;
    return matchType && matchSource;
  }) ?? [];

  const lowStockProducts = filteredInventory.filter(p => p.quantity > 0 && p.quantity < 5);
  const marketingProducts = filteredInventory.filter(p => p.quantity > 0 && p.daysSinceImport > 30);

  const handleExportInventoryExcel = useCallback(() => {
    if (!inventoryDetail || inventoryDetail.length === 0) {
      toast({ title: "Không có dữ liệu để xuất", variant: "destructive" });
      return;
    }
    const data = inventoryDetail.map((p, idx) => ({
      "STT": idx + 1,
      "Tên sản phẩm": p.name,
      "Loại mặt hàng": p.productTypeName ?? "",
      "Nguồn hàng": p.supplySourceName ?? "",
      "Đã nhập": p.totalImported,
      "Đã bán": p.totalSold,
      "Còn lại": p.quantity,
      "Giá vốn": p.costPrice,
      "Giá bán": p.sellPrice,
      "Vốn tồn": p.inventoryValue,
      "Ngày nhập gần nhất": p.lastImportDate ?? "",
      "Số ngày tồn": p.daysSinceImport,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kho hàng");
    XLSX.writeFile(wb, `bao-cao-kho-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Đã xuất báo cáo kho Excel" });
  }, [inventoryDetail, toast]);

  const bySource = supplySources?.map(ss => ({
    name: ss.name,
    value: inventoryDetail?.filter(p => p.supplySourceId === ss.id).reduce((s, p) => s + p.inventoryValue, 0) ?? 0,
    count: inventoryDetail?.filter(p => p.supplySourceId === ss.id && p.quantity > 0).length ?? 0,
  })) ?? [];

  const topTurnover = [...(inventoryDetail ?? [])]
    .filter(p => p.soldLast30Days > 0)
    .sort((a, b) => b.soldLast30Days - a.soldLast30Days)
    .slice(0, 5);

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
                  <CardTitle className="text-base font-semibold">Xu hướng doanh thu (7 ngày gần nhất)</CardTitle>
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
                    <span className="font-medium">Xem báo cáo chi tiết</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu tháng này</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(salesMonthly?.monthRevenue ?? 0)} đ</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Số đơn tháng này</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{salesMonthly?.monthOrders ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Số khách tháng này</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{salesMonthly?.monthCustomers ?? 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Xu hướng doanh thu theo ngày (tháng này)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {salesMonthly?.dailyRevenue && salesMonthly.dailyRevenue.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesMonthly.dailyRevenue} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} label={{ value: "Ngày", position: "insideBottomRight", offset: -5 }} />
                        <YAxis tickFormatter={(val) => `${val / 1000000}M`} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        <Tooltip formatter={(value: number) => [`${formatCurrency(value)} đ`, "Doanh thu"]} labelFormatter={(label) => `Ngày ${label}`} />
                        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }} />
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
                <CardTitle className="text-base font-semibold">Top sản phẩm bán chạy (theo doanh thu)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Nguồn hàng</TableHead>
                      <TableHead className="text-right">Đã bán</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                      <TableHead className="text-right">Lợi nhuận</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesMonthly?.topProducts && salesMonthly.topProducts.length > 0 ? salesMonthly.topProducts.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-muted-foreground font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{p.productName ?? "(Không tên)"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.productTypeName ?? "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.supplySourceName ?? "-"}</TableCell>
                        <TableCell className="text-right text-sm">{p.totalSold}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-primary">{formatCurrency(p.totalRevenue)} đ</TableCell>
                        <TableCell className="text-right text-sm text-emerald-600">{formatCurrency(p.totalProfit)} đ</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Chưa có dữ liệu bán hàng tháng này</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== LÃI LỖ ===== */}
        {activeTab === "lai-lo" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Lợi nhuận tháng này</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{formatCurrency(profitLoss?.monthProfit ?? 0)} đ</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu tháng này</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(profitLoss?.monthRevenue ?? 0)} đ</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Giá vốn tháng này</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(profitLoss?.monthCostTotal ?? 0)} đ</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Lợi nhuận theo tháng (12 tháng gần nhất)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {profitLoss?.profitByMonth && profitLoss.profitByMonth.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profitLoss.profitByMonth} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                        <YAxis tickFormatter={(val) => `${val / 1000000}M`} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${formatCurrency(value)} đ`,
                            name === "profit" ? "Lợi nhuận" : name === "revenue" ? "Doanh thu" : "Giá vốn"
                          ]}
                        />
                        <Legend formatter={(val) => val === "profit" ? "Lợi nhuận" : val === "revenue" ? "Doanh thu" : "Giá vốn"} />
                        <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cost" fill="#f97316" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
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
            {/* Header + filter */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold">Danh sách sản phẩm</h2>
              <Select value={inventoryTypeFilter} onValueChange={setInventoryTypeFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Loại mặt hàng" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả loại</SelectItem>
                  {productTypes?.map(pt => <SelectItem key={pt.id} value={String(pt.id)}>{pt.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={inventorySourceFilter} onValueChange={setInventorySourceFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Nguồn hàng" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả nguồn</SelectItem>
                  {supplySources?.map(ss => <SelectItem key={ss.id} value={String(ss.id)}>{ss.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button variant="outline" onClick={handleExportInventoryExcel} className="h-9 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                <FileDown className="w-4 h-4 mr-2" /> Xuất Excel báo cáo kho
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setImportOpen(true)}>
                <PackagePlus className="w-4 h-4 mr-2" /> Nhập kho
              </Button>
            </div>

            {/* Cảnh báo tồn thấp */}
            {lowStockProducts.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Cảnh báo tồn thấp (dưới 5 sản phẩm)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 border border-amber-300 rounded-md text-sm">
                        <span className="font-medium text-amber-800">{p.name}</span>
                        <Badge variant="outline" className="text-amber-700 border-amber-400 text-xs">{p.quantity} còn</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Marketing table (tồn > 30 ngày) */}
            {marketingProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-orange-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Sản phẩm cần đẩy marketing (tồn trên 30 ngày)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Tên sản phẩm</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Nguồn hàng</TableHead>
                        <TableHead className="text-right">Tồn</TableHead>
                        <TableHead>Ngày nhập gần nhất</TableHead>
                        <TableHead className="text-right">Số ngày tồn</TableHead>
                        <TableHead className="text-right">Vốn tồn</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketingProducts.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.productTypeName ?? "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.supplySourceName ?? "-"}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{p.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{p.lastImportDate ? formatDate(p.lastImportDate) : "-"}</TableCell>
                          <TableCell className="text-right text-sm text-orange-600 font-medium">{p.daysSinceImport} ngày</TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatCurrency(p.inventoryValue)} đ</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50 text-xs">Cảnh báo</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Danh sách đầy đủ sản phẩm */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Danh sách sản phẩm ({filteredInventory.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredInventory.length > 0 ? filteredInventory.map(p => (
                    <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Laptop className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {p.productTypeName && <span>{p.productTypeName}</span>}
                          {p.productTypeName && p.supplySourceName && <span> · </span>}
                          {p.supplySourceName && <span>{p.supplySourceName}</span>}
                        </div>
                        <div className="text-xs mt-1 text-muted-foreground">
                          Đã nhập: <span className="text-blue-600 font-medium">{p.totalImported}</span>
                          {" | "}Đã bán: <span className="text-emerald-600 font-medium">{p.totalSold}</span>
                          {" | "}Còn: <span className={`font-medium ${p.quantity < 5 ? "text-red-600" : "text-foreground"}`}>{p.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium">{formatCurrency(p.sellPrice)} đ</div>
                        <div className="text-xs text-muted-foreground">Vốn: {formatCurrency(p.costPrice)} đ</div>
                        {p.quantity <= 0 ? (
                          <Badge variant="destructive" className="text-xs mt-1">Hết hàng</Badge>
                        ) : p.quantity < 5 ? (
                          <Badge variant="outline" className="text-xs mt-1 border-amber-400 text-amber-700">Tồn thấp</Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-primary"
                          onClick={() => {
                            setEditProductData({
                              id: p.id, name: p.name, sellPrice: String(p.sellPrice), costPrice: String(p.costPrice), note: p.note ?? "",
                              quantity: p.quantity, productTypeId: p.productTypeId, supplySourceId: p.supplySourceId, warrantyMonths: p.warrantyMonths,
                            });
                            setEditProductOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteProduct(p.id, p.name)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="h-24 flex items-center justify-center text-muted-foreground">Không có sản phẩm nào</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tồn kho theo nguồn hàng */}
            {bySource.some(s => s.value > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Tồn kho theo nguồn hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bySource.filter(s => s.count > 0).map(s => (
                      <div key={s.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.count} sản phẩm</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">{formatCurrency(s.value)} đ</div>
                          <div className="text-xs text-muted-foreground">vốn tồn</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TOP sản phẩm quay tiền nhanh */}
            {topTurnover.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">TOP sản phẩm bán chạy (30 ngày qua)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topTurnover.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.productTypeName} · {p.supplySourceName}</div>
                        </div>
                        <Badge variant="secondary" className="text-emerald-700 bg-emerald-50">{p.soldLast30Days} bán/30 ngày</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ===== BẢO HÀNH ===== */}
        {activeTab === "bao-hanh" && (
          <div className="flex flex-col gap-6">
            {/* Banner */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="py-4">
                <div className="text-center">
                  <div className="text-xs font-semibold text-blue-600 tracking-widest uppercase mb-2">Hệ thống tra cứu bảo hành</div>
                  <div className="text-sm font-medium text-blue-800">Tìm đơn còn bảo hành theo SĐT / Tên / Mã đơn / Sản phẩm / Nguồn hàng</div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Input
                placeholder="Tìm kiếm nhanh (tên, SĐT, mã đơn, sản phẩm, nguồn hàng)..."
                value={warrantySearch}
                onChange={e => setWarrantySearch(e.target.value)}
                className="max-w-lg"
              />
              <div className="text-sm text-muted-foreground font-medium">
                Đang có <span className="text-primary font-bold">{activeWarranties?.length ?? 0}</span> đơn còn bảo hành
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách / SĐT</TableHead>
                      <TableHead>Loại / Sản phẩm</TableHead>
                      <TableHead>Hết bảo hành</TableHead>
                      <TableHead>Nguồn hàng</TableHead>
                      <TableHead className="text-center">Xem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWarranties.length > 0 ? filteredWarranties.map(w => {
                      const days = w.daysRemaining ?? 0;
                      const isUrgent = days < 30;
                      const isWarning = days >= 30 && days < 60;
                      return (
                        <TableRow key={w.orderId}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{w.orderCode ?? `#${w.orderId}`}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{w.customerName}</div>
                            <div className="text-xs text-muted-foreground">{w.customerPhone}</div>
                            {w.customerEmail && <div className="text-xs text-blue-600">{w.customerEmail}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{w.customProductName ?? w.productTypeName ?? "-"}</div>
                            {w.warrantyCode && <div className="text-xs font-mono text-muted-foreground">{w.warrantyCode}</div>}
                          </TableCell>
                          <TableCell>
                            {w.warrantyExpiry ? (
                              <div>
                                <div className={`text-sm font-medium ${isUrgent ? "text-red-600" : isWarning ? "text-orange-500" : "text-emerald-600"}`}>
                                  {formatDate(w.warrantyExpiry)}
                                </div>
                                <div className={`text-xs ${isUrgent ? "text-red-500" : isWarning ? "text-orange-400" : "text-muted-foreground"}`}>
                                  Còn {days} ngày
                                </div>
                              </div>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{w.supplySourceName ?? "-"}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary h-7 text-xs"
                              onClick={() => setLocation(`/?customerId=${w.customerId}`)}
                            >
                              Xem
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          {warrantySearch ? "Không tìm thấy kết quả phù hợp" : "Không có đơn nào còn bảo hành"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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

      {/* Edit product dialog */}
      <Dialog open={editProductOpen} onOpenChange={(o) => { setEditProductOpen(o); if (!o) setEditProductData(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa sản phẩm</DialogTitle>
          </DialogHeader>
          {editProductData && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Tên sản phẩm *</Label>
                <Input value={editProductData.name} onChange={e => setEditProductData({ ...editProductData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Giá nhập kho (đ)</Label>
                  <Input type="number" min="0" value={editProductData.costPrice} onChange={e => setEditProductData({ ...editProductData, costPrice: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Giá bán (đ)</Label>
                  <Input type="number" min="0" value={editProductData.sellPrice} onChange={e => setEditProductData({ ...editProductData, sellPrice: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Ghi chú</Label>
                <Input value={editProductData.note} onChange={e => setEditProductData({ ...editProductData, note: e.target.value })} placeholder="Mô tả sản phẩm..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditProductOpen(false); setEditProductData(null); }}>Hủy</Button>
            <Button onClick={handleEditProductSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={updateProduct.isPending}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
