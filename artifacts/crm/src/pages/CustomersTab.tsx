import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Plus, LayoutGrid, LayoutList, Columns, Phone, Pencil, Lock, Trash2 } from "lucide-react";
import { 
  useListCustomers, 
  useListEmployees, 
  useListCustomerStatuses,
  useDeleteCustomer,
  getListCustomersQueryKey,
  Customer,
} from "@workspace/api-client-react";
import { formatCurrency, formatDate, formatCustomerCode } from "@/lib/format";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function CustomersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusId, setStatusId] = useState<number | undefined>();
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  const [needFollowUp, setNeedFollowUp] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("open") === "add") {
      setSelectedCustomer(undefined);
      setDialogOpen(true);
      setLocation("/", { replace: true });
    }
  }, [setLocation]);

  const { data: statusesData } = useListCustomerStatuses();
  const { data: employeesData } = useListEmployees();
  const deleteCustomer = useDeleteCustomer();

  const { data: customersData, isLoading } = useListCustomers({
    page,
    pageSize,
    statusId,
    employeeId,
    needFollowUp,
    search: debouncedSearch || undefined
  }, {
    query: {
      enabled: true,
      queryKey: getListCustomersQueryKey({ page, pageSize, statusId, employeeId, needFollowUp, search: debouncedSearch })
    }
  });

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
      try {
        await deleteCustomer.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        toast({ title: "Đã xóa khách hàng" });
      } catch (error) {
        toast({ title: "Lỗi khi xóa", variant: "destructive" });
      }
    }
  };

  return (
    <MainLayout activeTab="khach-hang">
      <div className="flex flex-col gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-md p-1 border border-border">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs bg-white shadow-sm" data-testid="btn-view-table">
                <LayoutList className="w-3.5 h-3.5 mr-1" />
                Table
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" data-testid="btn-view-kanban">
                <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                Kanban
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" data-testid="btn-view-columns">
                <Columns className="w-3.5 h-3.5 mr-1" />
                Ẩn cột
              </Button>
            </div>
            
            <div className="h-6 w-px bg-border mx-2"></div>
            
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9" 
              data-testid="btn-add-customer"
              onClick={() => {
                setSelectedCustomer(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              THÊM KHÁCH HÀNG MỚI
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Input 
              placeholder="Tìm kiếm..." 
              className="h-9 w-[200px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-customer"
            />
            
            <Select value={statusId?.toString() || "all"} onValueChange={(val) => { setStatusId(val === "all" ? undefined : Number(val)); setPage(1); }}>
              <SelectTrigger className="h-9 w-[160px]" data-testid="select-status-filter">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {statusesData?.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={employeeId?.toString() || "all"} onValueChange={(val) => { setEmployeeId(val === "all" ? undefined : Number(val)); setPage(1); }}>
              <SelectTrigger className="h-9 w-[160px]" data-testid="select-employee-filter">
                <SelectValue placeholder="Tất cả nhân viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                {employeesData?.map(e => (
                  <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 border border-border rounded-md px-3 h-9 bg-white">
              <Checkbox 
                id="needFollowUp" 
                checked={needFollowUp}
                onCheckedChange={(checked) => { setNeedFollowUp(checked === true); setPage(1); }}
                data-testid="checkbox-need-followup"
              />
              <label htmlFor="needFollowUp" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                Cần chăm 7 ngày tới
              </label>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Ngày tạo</TableHead>
                  <TableHead>Tên khách hàng</TableHead>
                  <TableHead>SĐT & Nguồn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Phụ trách</TableHead>
                  <TableHead className="w-[200px]">Ghi chú</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                  <TableHead className="text-right">Lợi nhuận</TableHead>
                  <TableHead>Liên hệ gần nhất</TableHead>
                  <TableHead>Ngày liên hệ tiếp</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">Đang tải dữ liệu...</TableCell>
                  </TableRow>
                ) : !customersData?.customers.length ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">Không tìm thấy khách hàng nào</TableCell>
                  </TableRow>
                ) : (
                  customersData.customers.map((c) => (
                    <TableRow key={c.id} data-testid={`row-customer-${c.id}`}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(c.createdAt)}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary hover:underline cursor-pointer block" onClick={() => { setSelectedCustomer(c); setDialogOpen(true); }}>
                          {formatCustomerCode(c.name, c.id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-sm font-medium">
                            <Phone className="w-3 h-3 mr-1 text-muted-foreground" />
                            {c.phone}
                          </div>
                          {c.sourceName && (
                            <div className="text-xs text-muted-foreground bg-muted inline-block px-1.5 py-0.5 rounded w-fit">
                              {c.sourceName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          style={{ 
                            backgroundColor: c.statusColor ? `${c.statusColor}20` : 'var(--muted)',
                            color: c.statusColor || 'inherit',
                            borderColor: c.statusColor ? `${c.statusColor}40` : 'var(--border)'
                          }}
                          className="font-medium hover:bg-transparent"
                          variant="outline"
                        >
                          {c.statusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{c.employeeName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="truncate max-w-[200px]" title={c.note || ""}>
                          {c.note || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCurrency(c.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm text-primary">
                        {formatCurrency(c.totalProfit)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.lastContactAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.nextContactAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => { setSelectedCustomer(c); setDialogOpen(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                            <Lock className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {customersData && customersData.totalPages > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <div className="text-sm text-muted-foreground">
                Hiển thị <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, customersData.total)}</span> trong tổng <span className="font-medium text-foreground">{customersData.total}</span> khách hàng
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Số dòng/trang:</span>
                  <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Trước
                      </Button>
                    </PaginationItem>
                    <PaginationItem className="px-3 text-sm font-medium">
                      Trang {page}/{customersData.totalPages}
                    </PaginationItem>
                    <PaginationItem>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={() => setPage(p => Math.min(customersData.totalPages, p + 1))}
                        disabled={page === customersData.totalPages}
                      >
                        Sau
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      </div>
      {dialogOpen && (
        <CustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} customer={selectedCustomer} />
      )}
    </MainLayout>
  );
}
