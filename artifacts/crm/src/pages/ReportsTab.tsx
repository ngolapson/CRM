import { MainLayout } from "@/components/layout/MainLayout";
import { useState } from "react";
import { format, subDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  useGetReportSummary, 
  useGetStatusDistribution,
  useGetCustomersByEmployee,
  useGetDailyTrend,
  useGetCustomersBySource,
  useGetTopSales,
  useGetMonthlyTrend,
  useGetMonthlyProfit,
  useGetTopCustomers,
  useGetRevenueBySource,
  useGetRevenueByEmployee,
  useGetExpiringWarranties,
  useGetExpiredWarranties,
  getGetReportSummaryQueryKey,
  getGetDailyTrendQueryKey,
  getGetExpiringWarrantiesQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { 
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, 
  Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Area, AreaChart, ComposedChart
} from "recharts";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6'];

export function ReportsTab() {
  const [fromDate, setFromDate] = useState(() => format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [warrantyDays, setWarrantyDays] = useState(30);

  const { data: summary } = useGetReportSummary({ fromDate, toDate }, { query: { queryKey: getGetReportSummaryQueryKey({ fromDate, toDate }) } });
  const { data: statusDistribution } = useGetStatusDistribution();
  const { data: customersByEmployee } = useGetCustomersByEmployee();
  const { data: dailyTrend } = useGetDailyTrend({ fromDate, toDate }, { query: { queryKey: getGetDailyTrendQueryKey({ fromDate, toDate }) } });
  const { data: customersBySource } = useGetCustomersBySource();
  const { data: topSales } = useGetTopSales();
  const { data: monthlyTrend } = useGetMonthlyTrend();
  const { data: monthlyProfit } = useGetMonthlyProfit();
  const { data: topCustomers } = useGetTopCustomers({ limit: 5 });
  const { data: revenueBySource } = useGetRevenueBySource();
  const { data: revenueByEmployee } = useGetRevenueByEmployee();
  const { data: expiringWarranties } = useGetExpiringWarranties({ days: warrantyDays }, { query: { queryKey: getGetExpiringWarrantiesQueryKey({ days: warrantyDays }) } });
  const { data: expiredWarranties } = useGetExpiredWarranties();
  
  const handleReset = () => {
    setFromDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    setToDate(format(new Date(), "yyyy-MM-dd"));
  };

  return (
    <MainLayout activeTab="bao-cao">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-border shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Từ ngày:</span>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[150px] h-9" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Đến ngày:</span>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[150px] h-9" />
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="h-9">Reset</Button>
          </div>
          <p className="text-xs text-muted-foreground ml-1">
            Đang lọc doanh thu & lợi nhuận theo ngày chốt đơn: {format(new Date(fromDate), "dd/MM/yyyy")} – {format(new Date(toDate), "dd/MM/yyyy")}
          </p>
        </div>

        {/* Row 1/2 stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lợi nhuận đã an toàn</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.safeProfit)} đ</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tiền rủi ro bảo hành</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-amber-500">{formatCurrency(summary?.warrantyRiskAmount)} đ</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vốn tồn kho</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(summary?.inventoryCapital)} đ</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sản phẩm cần đẩy bán</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-destructive">{summary?.productsNeedPush || 0}</div></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vòng quay tồn kho (30 ngày)</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{summary?.inventoryTurnover || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tuổi tồn kho trung bình</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{summary?.averageInventoryAge || 0} ngày</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng khách hàng / Hôm nay</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{summary?.totalCustomers || 0} <span className="text-base font-normal text-muted-foreground">/ {summary?.todayCustomers || 0}</span></div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng doanh thu / Tổng lợi nhuận</CardTitle></CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-primary">{formatCurrency(summary?.totalRevenue)} đ</div>
              <div className="text-sm font-semibold text-emerald-600 mt-1">{formatCurrency(summary?.totalProfit)} đ</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Phân bổ theo trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {statusDistribution && statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusDistribution} dataKey="count" nameKey="statusName" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.statusColor || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-muted-foreground">Không có dữ liệu</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Khách hàng theo nhân viên</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {customersByEmployee && customersByEmployee.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customersByEmployee.map(e => ({
                      ...e,
                      total: Object.values(e.statusBreakdown ?? {}).reduce((s, v) => s + v, 0),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="employeeName" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Tổng KH" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
              <CardTitle className="text-sm font-semibold">Xu hướng theo ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {dailyTrend && dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={val => val.substring(5)} fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="newCustomers" name="Khách mới" stroke="#3b82f6" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="closedOrders" name="Đơn đã chốt" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-muted-foreground">Không có dữ liệu</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Khách hàng theo nguồn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {customersBySource && customersBySource.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customersBySource} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={12} />
                      <YAxis dataKey="sourceName" type="category" width={80} fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="closed" name="Đã chốt" stackId="a" fill="#10b981" />
                      <Bar dataKey="notClosed" name="Chưa chốt" stackId="a" fill="#94a3b8" />
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
              <CardTitle className="text-sm font-semibold">Top sale chốt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {topSales && topSales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={topSales}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="employeeName" fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="closedCount" name="Đơn đã chốt" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="closeRate" name="Tỷ lệ chốt" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-muted-foreground">Không có dữ liệu</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Theo dõi theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {monthlyTrend && monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="newCustomers" name="Khách mới" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="closedOrders" name="Đơn đã chốt" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-muted-foreground">Không có dữ liệu</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Lợi nhuận theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {monthlyProfit && monthlyProfit.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyProfit}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis tickFormatter={v => `${v/1000000}M`} fontSize={12} />
                      <Tooltip formatter={(val: number) => `${formatCurrency(val)} đ`} />
                      <Legend />
                      <Bar dataKey="profit" name="Lợi nhuận" fill="#10b981" radius={[4, 4, 0, 0]} />
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
              <CardTitle className="text-sm font-semibold">Top doanh thu theo khách hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                      <TableHead className="text-right">Lợi nhuận</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers && topCustomers.length > 0 ? (
                      topCustomers.map(c => (
                        <TableRow key={c.customerId}>
                          <TableCell className="font-medium">{c.customerName}</TableCell>
                          <TableCell className="text-right text-primary">{formatCurrency(c.totalRevenue)}</TableCell>
                          <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(c.totalProfit)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Doanh thu theo nguồn khách</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {revenueBySource && revenueBySource.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={revenueBySource} dataKey="totalRevenue" nameKey="sourceName" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                        {revenueBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => `${formatCurrency(val)} đ`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-muted-foreground">Không có dữ liệu</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Doanh thu theo nhân viên</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByEmployee && revenueByEmployee.length > 0 ? (
                      revenueByEmployee.map((e, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{e.employeeName}</TableCell>
                          <TableCell className="text-right text-primary font-medium">{formatCurrency(e.totalRevenue)} đ</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={2} className="text-center h-24 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Đơn sắp hết bảo hành</CardTitle>
              <div className="absolute right-6 top-5 flex items-center gap-2">
                <Select value={warrantyDays.toString()} onValueChange={v => setWarrantyDays(Number(v))}>
                  <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 ngày tới</SelectItem>
                    <SelectItem value="30">30 ngày tới</SelectItem>
                    <SelectItem value="60">60 ngày tới</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Mặt hàng</TableHead>
                      <TableHead>Hết hạn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringWarranties && expiringWarranties.length > 0 ? (
                      expiringWarranties.map(w => (
                        <TableRow key={w.orderId}>
                          <TableCell className="font-medium text-xs">{w.customerName}</TableCell>
                          <TableCell className="text-xs">{w.productTypeName || '-'}</TableCell>
                          <TableCell className="text-amber-600 font-medium text-xs">{formatDate(w.warrantyExpiry)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">Không có đơn hàng</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-destructive">Đơn đã hết bảo hành</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>SĐT</TableHead>
                      <TableHead>Mặt hàng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiredWarranties && expiredWarranties.length > 0 ? (
                      expiredWarranties.map(w => (
                        <TableRow key={w.orderId}>
                          <TableCell className="font-medium text-xs">{w.customerName}</TableCell>
                          <TableCell className="text-xs">{w.phone}</TableCell>
                          <TableCell className="text-xs">{w.productTypeName || '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">Không có đơn hàng</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
