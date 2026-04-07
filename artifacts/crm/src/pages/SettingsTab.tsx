import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, ArrowUp, ArrowDown, Plus, Tag, Truck, Package, PackagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListEmployees, useDeleteEmployee, useCreateEmployee, useUpdateEmployee,
  useListCustomerStatuses, useDeleteCustomerStatus, useCreateCustomerStatus,
  useUpdateCustomerStatus, useReorderCustomerStatuses,
  useListCustomerSources, useDeleteCustomerSource, useCreateCustomerSource, useUpdateCustomerSource,
  useListProductTypes, useDeleteProductType, useCreateProductType, useUpdateProductType,
  useListSupplySources, useDeleteSupplySource, useCreateSupplySource, useUpdateSupplySource,
  useListProducts, useDeleteProduct, useCreateProduct, useUpdateProduct,
  useListStockReceipts, useCreateStockReceipt, useDeleteStockReceipt,
  getListEmployeesQueryKey, getListCustomerStatusesQueryKey, getListCustomerSourcesQueryKey,
  getListProductTypesQueryKey, getListSupplySourcesQueryKey, getListProductsQueryKey,
  getListStockReceiptsQueryKey,
  Employee, CustomerStatus, CustomerSource, ProductType, SupplySource, Product,
} from "@workspace/api-client-react";
import { GenericDialog } from "@/components/settings/SettingsDialogs";
import { formatCurrency, formatDate } from "@/lib/format";
import * as z from "zod";

type EntityType = "employee" | "status" | "source" | "productType" | "supplySource";
type AnyEntity = Employee | CustomerStatus | CustomerSource | ProductType | SupplySource;

interface DialogState {
  open: boolean;
  type: EntityType | null;
  entity: AnyEntity | null;
}

interface DialogField {
  name: string;
  label: string;
  type?: string;
}

interface DialogPropsShape {
  title: string;
  schema: z.ZodTypeAny;
  fields: DialogField[];
}

interface ProductFormState {
  open: boolean;
  product: Product | null;
}

interface ImportStockState {
  open: boolean;
  productId: number | null;
}

export function SettingsTab() {
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees } = useListEmployees();
  const { data: statuses } = useListCustomerStatuses();
  const { data: sources } = useListCustomerSources();
  const { data: productTypes } = useListProductTypes();
  const { data: supplySources } = useListSupplySources();
  const { data: products } = useListProducts();
  const { data: stockReceipts } = useListStockReceipts();

  const deleteEmployee = useDeleteEmployee();
  const deleteStatus = useDeleteCustomerStatus();
  const deleteSource = useDeleteCustomerSource();
  const deleteProductType = useDeleteProductType();
  const deleteSupplySource = useDeleteSupplySource();
  const deleteProduct = useDeleteProduct();
  const deleteStockReceipt = useDeleteStockReceipt();

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const createStatus = useCreateCustomerStatus();
  const updateStatus = useUpdateCustomerStatus();
  const reorderStatuses = useReorderCustomerStatuses();
  const createSource = useCreateCustomerSource();
  const updateSource = useUpdateCustomerSource();
  const createProductType = useCreateProductType();
  const updateProductType = useUpdateProductType();
  const createSupplySource = useCreateSupplySource();
  const updateSupplySource = useUpdateSupplySource();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createStockReceipt = useCreateStockReceipt();

  const [dialogState, setDialogState] = useState<DialogState>({ open: false, type: null, entity: null });
  const [productForm, setProductForm] = useState<ProductFormState>({ open: false, product: null });
  const [importStock, setImportStock] = useState<ImportStockState>({ open: false, productId: null });
  const [productFilter, setProductFilter] = useState("");
  const initialSection = (() => {
    const s = new URLSearchParams(search).get("section");
    return (s === "products" || s === "receipts" || s === "entities") ? s : "entities";
  })() as "entities" | "products" | "receipts";
  const [activeSettingsSection, setActiveSettingsSection] = useState<"entities" | "products" | "receipts">(initialSection);

  useEffect(() => {
    const section = new URLSearchParams(search).get("section");
    if (section === "products" || section === "receipts" || section === "entities") {
      setActiveSettingsSection(section);
    }
  }, [search]);

  const [importData, setImportData] = useState({ quantity: "", importDate: new Date().toISOString().split("T")[0], note: "" });
  const [productFormData, setProductFormData] = useState({
    name: "", productTypeId: "", supplySourceId: "", quantity: "0", costPrice: "0", sellPrice: "0", warrantyMonths: "", note: "",
  });

  const handleDelete = async (type: EntityType, id: number, name: string) => {
    if (!confirm(`Xóa ${name}?`)) return;
    try {
      if (type === "employee") await deleteEmployee.mutateAsync({ id });
      if (type === "status") await deleteStatus.mutateAsync({ id });
      if (type === "source") await deleteSource.mutateAsync({ id });
      if (type === "productType") await deleteProductType.mutateAsync({ id });
      if (type === "supplySource") await deleteSupplySource.mutateAsync({ id });

      if (type === "employee") queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
      if (type === "status") queryClient.invalidateQueries({ queryKey: getListCustomerStatusesQueryKey() });
      if (type === "source") queryClient.invalidateQueries({ queryKey: getListCustomerSourcesQueryKey() });
      if (type === "productType") queryClient.invalidateQueries({ queryKey: getListProductTypesQueryKey() });
      if (type === "supplySource") queryClient.invalidateQueries({ queryKey: getListSupplySourcesQueryKey() });

      toast({ title: `Đã xóa ${name}` });
    } catch {
      toast({ title: `Không thể xóa ${name}`, variant: "destructive" });
    }
  };

  const handleReorderStatus = async (statusId: number, direction: "up" | "down") => {
    if (!statuses) return;
    const idx = statuses.findIndex(s => s.id === statusId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === statuses.length - 1) return;

    const newOrder = [...statuses.map(s => s.id)];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    try {
      await reorderStatuses.mutateAsync({ data: { ids: newOrder } });
      queryClient.invalidateQueries({ queryKey: getListCustomerStatusesQueryKey() });
    } catch {
      toast({ title: "Không thể sắp xếp", variant: "destructive" });
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const isEdit = !!dialogState.entity;
      const id = dialogState.entity?.id;

      if (dialogState.type === "employee") {
        const data = {
          name: String(values.name ?? ""),
          role: String(values.role ?? "Nhân viên"),
          position: values.position ? String(values.position) : undefined,
          username: values.username ? String(values.username) : null,
          password: values.password ? String(values.password) : null,
          managerId: values.managerId ? Number(values.managerId) : null,
        };
        if (isEdit && id) await updateEmployee.mutateAsync({ id, data });
        else await createEmployee.mutateAsync({ data });
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
      } else if (dialogState.type === "status") {
        const data = { name: String(values.name ?? ""), color: String(values.color ?? "#6b7280") };
        if (isEdit && id) await updateStatus.mutateAsync({ id, data });
        else await createStatus.mutateAsync({ data: { ...data, sortOrder: (statuses?.length ?? 0) + 1 } });
        queryClient.invalidateQueries({ queryKey: getListCustomerStatusesQueryKey() });
      } else if (dialogState.type === "source") {
        const data = { name: String(values.name ?? ""), description: values.description ? String(values.description) : undefined };
        if (isEdit && id) await updateSource.mutateAsync({ id, data });
        else await createSource.mutateAsync({ data });
        queryClient.invalidateQueries({ queryKey: getListCustomerSourcesQueryKey() });
      } else if (dialogState.type === "productType") {
        const data = { name: String(values.name ?? ""), slug: values.slug ? String(values.slug) : undefined };
        if (isEdit && id) await updateProductType.mutateAsync({ id, data });
        else await createProductType.mutateAsync({ data });
        queryClient.invalidateQueries({ queryKey: getListProductTypesQueryKey() });
      } else if (dialogState.type === "supplySource") {
        const data = {
          name: String(values.name ?? ""),
          phone: values.phone ? String(values.phone) : null,
          email: values.email ? String(values.email) : null,
          note: values.note ? String(values.note) : null,
        };
        if (isEdit && id) await updateSupplySource.mutateAsync({ id, data });
        else await createSupplySource.mutateAsync({ data });
        queryClient.invalidateQueries({ queryKey: getListSupplySourcesQueryKey() });
      }
      toast({ title: "Đã lưu thành công" });
    } catch {
      toast({ title: "Đã xảy ra lỗi", variant: "destructive" });
    }
  };

  const openProductForm = (product: Product | null) => {
    if (product) {
      setProductFormData({
        name: product.name,
        productTypeId: product.productTypeId ? String(product.productTypeId) : "",
        supplySourceId: product.supplySourceId ? String(product.supplySourceId) : "",
        quantity: String(product.quantity),
        costPrice: String(product.costPrice),
        sellPrice: String(product.sellPrice),
        warrantyMonths: product.warrantyMonths ? String(product.warrantyMonths) : "",
        note: product.note ?? "",
      });
    } else {
      setProductFormData({ name: "", productTypeId: "", supplySourceId: "", quantity: "0", costPrice: "0", sellPrice: "0", warrantyMonths: "", note: "" });
    }
    setProductForm({ open: true, product });
  };

  const handleProductSubmit = async () => {
    if (!productFormData.name) { toast({ title: "Vui lòng nhập tên sản phẩm", variant: "destructive" }); return; }
    try {
      const data = {
        name: productFormData.name,
        productTypeId: productFormData.productTypeId ? Number(productFormData.productTypeId) : undefined,
        supplySourceId: productFormData.supplySourceId ? Number(productFormData.supplySourceId) : undefined,
        quantity: Number(productFormData.quantity) || 0,
        costPrice: Number(productFormData.costPrice) || 0,
        sellPrice: Number(productFormData.sellPrice) || 0,
        warrantyMonths: productFormData.warrantyMonths ? Number(productFormData.warrantyMonths) : undefined,
        note: productFormData.note || undefined,
      };
      if (productForm.product) {
        await updateProduct.mutateAsync({ id: productForm.product.id, data });
      } else {
        await createProduct.mutateAsync({ data });
      }
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      setProductForm({ open: false, product: null });
      toast({ title: "Đã lưu sản phẩm" });
    } catch {
      toast({ title: "Lỗi khi lưu sản phẩm", variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Xóa sản phẩm "${name}"?`)) return;
    try {
      await deleteProduct.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast({ title: `Đã xóa ${name}` });
    } catch {
      toast({ title: "Không thể xóa sản phẩm", variant: "destructive" });
    }
  };

  const handleImportStock = async () => {
    if (!importStock.productId || !importData.quantity || !importData.importDate) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" }); return;
    }
    try {
      await createStockReceipt.mutateAsync({
        data: {
          productId: importStock.productId,
          quantity: Number(importData.quantity),
          importDate: importData.importDate,
          note: importData.note || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListStockReceiptsQueryKey() });
      setImportStock({ open: false, productId: null });
      setImportData({ quantity: "", importDate: new Date().toISOString().split("T")[0], note: "" });
      toast({ title: "Đã nhập kho thành công" });
    } catch {
      toast({ title: "Lỗi khi nhập kho", variant: "destructive" });
    }
  };

  const handleDeleteReceipt = async (id: number) => {
    if (!confirm("Xóa phiếu nhập kho này? Sẽ trừ lại tồn kho tương ứng.")) return;
    try {
      await deleteStockReceipt.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListStockReceiptsQueryKey() });
      toast({ title: "Đã xóa phiếu nhập kho" });
    } catch {
      toast({ title: "Lỗi khi xóa phiếu nhập kho", variant: "destructive" });
    }
  };

  const getDialogProps = (): DialogPropsShape | null => {
    if (dialogState.type === "employee") return {
      title: dialogState.entity ? "Sửa nhân viên" : "Thêm nhân viên",
      schema: z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        position: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        managerId: z.union([z.string(), z.number()]).optional(),
      }),
      fields: [
        { name: "name", label: "Tên nhân viên" },
        { name: "role", label: "Vai trò (Admin/Nhân viên)" },
        { name: "position", label: "Chức vụ" },
        { name: "username", label: "Tên đăng nhập" },
        { name: "password", label: "Mật khẩu (để trống = không đổi)", type: "password" },
      ],
    };
    if (dialogState.type === "status") return {
      title: dialogState.entity ? "Sửa trạng thái" : "Thêm trạng thái",
      schema: z.object({ name: z.string().min(1), color: z.string().min(1) }),
      fields: [{ name: "name", label: "Tên trạng thái" }, { name: "color", label: "Màu sắc (Hex)", type: "color" }],
    };
    if (dialogState.type === "source") return {
      title: dialogState.entity ? "Sửa nguồn khách" : "Thêm nguồn khách",
      schema: z.object({ name: z.string().min(1), description: z.string().optional() }),
      fields: [{ name: "name", label: "Tên nguồn" }, { name: "description", label: "Mô tả" }],
    };
    if (dialogState.type === "productType") return {
      title: dialogState.entity ? "Sửa loại mặt hàng" : "Thêm loại mặt hàng",
      schema: z.object({ name: z.string().min(1), slug: z.string().optional() }),
      fields: [{ name: "name", label: "Tên loại mặt hàng" }, { name: "slug", label: "Mã (Slug)" }],
    };
    if (dialogState.type === "supplySource") return {
      title: dialogState.entity ? "Sửa nguồn hàng" : "Thêm nguồn hàng",
      schema: z.object({
        name: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().optional(),
        note: z.string().optional(),
      }),
      fields: [
        { name: "name", label: "Tên nguồn hàng" },
        { name: "phone", label: "Số điện thoại" },
        { name: "email", label: "Email" },
        { name: "note", label: "Ghi chú" },
      ],
    };
    return null;
  };

  const dialogProps = getDialogProps();
  const filteredProducts = products?.filter(p => !productFilter || p.name.toLowerCase().includes(productFilter.toLowerCase()));

  return (
    <MainLayout activeTab="cai-dat">
      {/* Section switcher */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeSettingsSection === "entities" ? "default" : "outline"}
          size="sm" onClick={() => setActiveSettingsSection("entities")}
        >Danh mục hệ thống</Button>
        <Button
          variant={activeSettingsSection === "products" ? "default" : "outline"}
          size="sm" onClick={() => setActiveSettingsSection("products")}
        ><Package className="w-4 h-4 mr-1" />Quản lý sản phẩm ({products?.length ?? 0})</Button>
        <Button
          variant={activeSettingsSection === "receipts" ? "default" : "outline"}
          size="sm" onClick={() => setActiveSettingsSection("receipts")}
        ><PackagePlus className="w-4 h-4 mr-1" />Lịch sử nhập kho ({stockReceipts?.length ?? 0})</Button>
      </div>

      {/* ===== ENTITIES ===== */}
      {activeSettingsSection === "entities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Column 1: Employees */}
          <Card className="flex flex-col h-[calc(100vh-240px)]">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 bg-card z-10">
              <CardTitle className="text-base font-semibold">Quản lý nhân viên</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setDialogState({ open: true, type: "employee", entity: null })} className="h-8 w-8 text-emerald-600">
                <Plus className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {employees?.map(e => (
                  <div key={e.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {e.name}
                        {e.isProtected && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Bảo vệ</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{e.role}{e.position && e.position !== "admin" ? ` · ${e.position}` : ""}</div>
                      {e.username && <div className="text-xs text-blue-600 mt-0.5">@{e.username}</div>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, type: "employee", entity: e })} className="h-7 w-7 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                      {!e.isProtected && <Button variant="ghost" onClick={() => handleDelete("employee", e.id, e.name)} size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setDialogState({ open: true, type: "employee", entity: null })}>+ Thêm nhân viên</Button>
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Statuses */}
          <Card className="flex flex-col h-[calc(100vh-240px)]">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 bg-card z-10">
              <CardTitle className="text-base font-semibold">Quản lý trạng thái</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setDialogState({ open: true, type: "status", entity: null })} className="h-8 w-8 text-emerald-600">
                <Plus className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {statuses?.map((s, idx) => (
                  <div key={s.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color ?? "#6b7280" }}></div>
                      <div>
                        <div className="font-medium text-sm">{s.name}</div>
                        {s.isSystem && <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 border-primary/20 text-primary/70">Hệ thống</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-0.5 items-center">
                      <Button variant="ghost" size="icon" onClick={() => handleReorderStatus(s.id, "up")} disabled={idx === 0} className="h-6 w-6 text-muted-foreground hover:text-foreground"><ArrowUp className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleReorderStatus(s.id, "down")} disabled={idx === (statuses?.length ?? 0) - 1} className="h-6 w-6 text-muted-foreground hover:text-foreground"><ArrowDown className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, type: "status", entity: s })} className="h-6 w-6 text-primary"><Pencil className="w-3 h-3" /></Button>
                      {!s.isSystem && <Button variant="ghost" onClick={() => handleDelete("status", s.id, s.name)} size="icon" className="h-6 w-6 text-destructive"><Trash2 className="w-3 h-3" /></Button>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setDialogState({ open: true, type: "status", entity: null })}>+ Thêm trạng thái</Button>
              </div>
            </CardContent>
          </Card>

          {/* Column 3: Customer Sources */}
          <Card className="flex flex-col h-[calc(100vh-240px)]">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 bg-card z-10">
              <CardTitle className="text-base font-semibold">Quản lý nguồn khách</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setDialogState({ open: true, type: "source", entity: null })} className="h-8 w-8 text-emerald-600">
                <Plus className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {sources?.map(s => (
                  <div key={s.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      {s.description && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">{s.description}</div>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, type: "source", entity: s })} className="h-7 w-7 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" onClick={() => handleDelete("source", s.id, s.name)} size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setDialogState({ open: true, type: "source", entity: null })}>+ Thêm nguồn khách</Button>
              </div>
            </CardContent>
          </Card>

          {/* Column 4: Product Types + Supply Sources */}
          <div className="flex flex-col gap-6 h-[calc(100vh-240px)]">
            <Card className="flex flex-col flex-1 min-h-0">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 bg-card z-10">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Tag className="w-4 h-4" /> Loại mặt hàng</CardTitle>
                <Button size="icon" variant="ghost" onClick={() => setDialogState({ open: true, type: "productType", entity: null })} className="h-8 w-8 text-emerald-600"><Plus className="w-5 h-5" /></Button>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1">
                <div className="divide-y">
                  {productTypes?.map(pt => (
                    <div key={pt.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium text-sm">{pt.name}</div>
                        {pt.slug && <div className="text-xs text-muted-foreground mt-0.5">{pt.slug}</div>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, type: "productType", entity: pt })} className="h-7 w-7 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" onClick={() => handleDelete("productType", pt.id, pt.name)} size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setDialogState({ open: true, type: "productType", entity: null })}>+ Thêm loại mặt hàng</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col flex-1 min-h-0">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 bg-card z-10">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Nguồn hàng</CardTitle>
                <Button size="icon" variant="ghost" onClick={() => setDialogState({ open: true, type: "supplySource", entity: null })} className="h-8 w-8 text-emerald-600"><Plus className="w-5 h-5" /></Button>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1">
                <div className="divide-y">
                  {supplySources?.map(ss => (
                    <div key={ss.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium text-sm">{ss.name}</div>
                        {ss.phone && <div className="text-xs text-muted-foreground">{ss.phone}</div>}
                        {ss.email && <div className="text-xs text-blue-600">{ss.email}</div>}
                      </div>
                      <div className="flex gap-1 items-center">
                        <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, type: "supplySource", entity: ss })} className="h-7 w-7 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" onClick={() => handleDelete("supplySource", ss.id, ss.name)} size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setDialogState({ open: true, type: "supplySource", entity: null })}>+ Thêm nguồn hàng</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== PRODUCTS ===== */}
      {activeSettingsSection === "products" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              className="max-w-xs"
            />
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openProductForm(null)}>
              <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Nguồn</TableHead>
                      <TableHead className="text-right">Tồn kho</TableHead>
                      <TableHead className="text-right">Giá vốn</TableHead>
                      <TableHead className="text-right">Giá bán</TableHead>
                      <TableHead className="text-center">BH (tháng)</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts && filteredProducts.length > 0 ? filteredProducts.map((p, idx) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{p.name}{p.note && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{p.note}</div>}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.productTypeName ?? "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.supplySourceName ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={p.quantity <= 0 ? "destructive" : p.quantity <= 5 ? "outline" : "secondary"} className={p.quantity > 5 ? "" : p.quantity <= 0 ? "" : "border-amber-400 text-amber-700"}>
                            {p.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(p.costPrice)} đ</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(p.sellPrice)} đ</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{p.warrantyMonths ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => { setImportStock({ open: true, productId: p.id }); setImportData({ quantity: "", importDate: new Date().toISOString().split("T")[0], note: "" }); }}>
                              <PackagePlus className="w-3 h-3 mr-1" /> Nhập kho
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openProductForm(p)} className="h-7 w-7 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id, p.name)} className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Không có sản phẩm nào</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== STOCK RECEIPTS ===== */}
      {activeSettingsSection === "receipts" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Lịch sử nhập kho ({stockReceipts?.length ?? 0} phiếu)</div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setActiveSettingsSection("products")}>
              <PackagePlus className="w-4 h-4 mr-2" /> Nhập kho mới
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead className="text-right">SL nhập</TableHead>
                    <TableHead>Ngày nhập</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockReceipts && stockReceipts.length > 0 ? stockReceipts.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.productName ?? "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.productTypeName ?? "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.supplySourceName ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-emerald-700 border-emerald-200 bg-emerald-50">+{r.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.importDate ? formatDate(r.importDate) : "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">{r.note ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteReceipt(r.id)} className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Chưa có phiếu nhập kho nào</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generic entity dialog */}
      {dialogState.open && dialogProps && (
        <GenericDialog
          key={`${dialogState.type}-${(dialogState.entity as { id?: number } | null)?.id ?? "new"}`}
          open={dialogState.open}
          onOpenChange={(open) => setDialogState({ ...dialogState, open })}
          title={dialogProps.title}
          entity={dialogState.entity}
          schema={dialogProps.schema}
          fields={dialogProps.fields}
          onSubmit={handleSubmit}
        />
      )}

      {/* Product add/edit dialog */}
      <Dialog open={productForm.open} onOpenChange={(o) => setProductForm({ ...productForm, open: o })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{productForm.product ? "Sửa sản phẩm" : "Thêm sản phẩm"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Tên sản phẩm *</Label>
              <Input value={productFormData.name} onChange={e => setProductFormData({ ...productFormData, name: e.target.value })} placeholder="Nhập tên sản phẩm..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Loại mặt hàng</Label>
                <Select value={productFormData.productTypeId} onValueChange={v => setProductFormData({ ...productFormData, productTypeId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Không chọn --</SelectItem>
                    {productTypes?.map(pt => <SelectItem key={pt.id} value={String(pt.id)}>{pt.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nguồn hàng</Label>
                <Select value={productFormData.supplySourceId} onValueChange={v => setProductFormData({ ...productFormData, supplySourceId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn nguồn..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Không chọn --</SelectItem>
                    {supplySources?.map(ss => <SelectItem key={ss.id} value={String(ss.id)}>{ss.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Tồn kho ban đầu</Label>
                <Input type="number" min="0" value={productFormData.quantity} onChange={e => setProductFormData({ ...productFormData, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Giá vốn (đ)</Label>
                <Input type="number" min="0" value={productFormData.costPrice} onChange={e => setProductFormData({ ...productFormData, costPrice: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Giá bán (đ)</Label>
                <Input type="number" min="0" value={productFormData.sellPrice} onChange={e => setProductFormData({ ...productFormData, sellPrice: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bảo hành (tháng)</Label>
                <Input type="number" min="0" value={productFormData.warrantyMonths} onChange={e => setProductFormData({ ...productFormData, warrantyMonths: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Ghi chú</Label>
                <Input value={productFormData.note} onChange={e => setProductFormData({ ...productFormData, note: e.target.value })} placeholder="Mô tả sản phẩm..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductForm({ open: false, product: null })}>Hủy</Button>
            <Button onClick={handleProductSubmit} className="bg-emerald-600 hover:bg-emerald-700">Lưu sản phẩm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import stock dialog */}
      <Dialog open={importStock.open} onOpenChange={(o) => setImportStock({ ...importStock, open: o })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-emerald-600" />
              Nhập kho
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-sm font-medium">
                {products?.find(p => p.id === importStock.productId)?.name ?? "Sản phẩm"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Tồn kho hiện tại: {products?.find(p => p.id === importStock.productId)?.quantity ?? 0} sản phẩm
              </div>
            </div>
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
            <Button variant="outline" onClick={() => setImportStock({ open: false, productId: null })}>Hủy</Button>
            <Button onClick={handleImportStock} className="bg-emerald-600 hover:bg-emerald-700">
              <PackagePlus className="w-4 h-4 mr-2" /> Xác nhận nhập kho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
