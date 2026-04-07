import { MainLayout } from "@/components/layout/MainLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowUp, ArrowDown, Plus, Tag, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListEmployees, useDeleteEmployee, useCreateEmployee, useUpdateEmployee,
  useListCustomerStatuses, useDeleteCustomerStatus, useCreateCustomerStatus, useUpdateCustomerStatus,
  useListCustomerSources, useDeleteCustomerSource, useCreateCustomerSource, useUpdateCustomerSource,
  useListProductTypes, useDeleteProductType, useCreateProductType, useUpdateProductType,
  useListSupplySources, useDeleteSupplySource, useCreateSupplySource, useUpdateSupplySource,
  getListEmployeesQueryKey, getListCustomerStatusesQueryKey, getListCustomerSourcesQueryKey,
  getListProductTypesQueryKey, getListSupplySourcesQueryKey
} from "@workspace/api-client-react";
import { GenericDialog } from "@/components/settings/SettingsDialogs";
import * as z from "zod";

export function SettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees } = useListEmployees();
  const { data: statuses } = useListCustomerStatuses();
  const { data: sources } = useListCustomerSources();
  const { data: productTypes } = useListProductTypes();
  const { data: supplySources } = useListSupplySources();

  const deleteEmployee = useDeleteEmployee();
  const deleteStatus = useDeleteCustomerStatus();
  const deleteSource = useDeleteCustomerSource();
  const deleteProductType = useDeleteProductType();
  const deleteSupplySource = useDeleteSupplySource();

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const createStatus = useCreateCustomerStatus();
  const updateStatus = useUpdateCustomerStatus();
  const createSource = useCreateCustomerSource();
  const updateSource = useUpdateCustomerSource();
  const createProductType = useCreateProductType();
  const updateProductType = useUpdateProductType();
  const createSupplySource = useCreateSupplySource();
  const updateSupplySource = useUpdateSupplySource();

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: 'employee' | 'status' | 'source' | 'productType' | 'supplySource' | null;
    entity: any;
  }>({ open: false, type: null, entity: null });

  const handleDelete = async (type: string, id: number, name: string) => {
    if (!confirm(`Xóa ${name}?`)) return;
    try {
      if (type === 'employee') await deleteEmployee.mutateAsync({ id });
      if (type === 'status') await deleteStatus.mutateAsync({ id });
      if (type === 'source') await deleteSource.mutateAsync({ id });
      if (type === 'productType') await deleteProductType.mutateAsync({ id });
      if (type === 'supplySource') await deleteSupplySource.mutateAsync({ id });
      
      if (type === 'employee') queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
      if (type === 'status') queryClient.invalidateQueries({ queryKey: getListCustomerStatusesQueryKey() });
      if (type === 'source') queryClient.invalidateQueries({ queryKey: getListCustomerSourcesQueryKey() });
      if (type === 'productType') queryClient.invalidateQueries({ queryKey: getListProductTypesQueryKey() });
      if (type === 'supplySource') queryClient.invalidateQueries({ queryKey: getListSupplySourcesQueryKey() });
      
      toast({ title: `Đã xóa ${name}` });
    } catch (e) {
      toast({ title: `Không thể xóa ${name}`, variant: "destructive" });
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const isEdit = !!dialogState.entity;
      const id = dialogState.entity?.id;
      
      if (dialogState.type === 'employee') {
        isEdit ? await updateEmployee.mutateAsync({ id, data: values }) : await createEmployee.mutateAsync({ data: values });
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
      } else if (dialogState.type === 'status') {
        isEdit ? await updateStatus.mutateAsync({ id, data: values }) : await createStatus.mutateAsync({ data: { ...values, sortOrder: statuses ? statuses.length + 1 : 1 } });
        queryClient.invalidateQueries({ queryKey: getListCustomerStatusesQueryKey() });
      } else if (dialogState.type === 'source') {
        isEdit ? await updateSource.mutateAsync({ id, data: values }) : await createSource.mutateAsync({ data: values });
        queryClient.invalidateQueries({ queryKey: getListCustomerSourcesQueryKey() });
      } else if (dialogState.type === 'productType') {
        isEdit ? await updateProductType.mutateAsync({ id, data: values }) : await createProductType.mutateAsync({ data: values });
        queryClient.invalidateQueries({ queryKey: getListProductTypesQueryKey() });
      } else if (dialogState.type === 'supplySource') {
        isEdit ? await updateSupplySource.mutateAsync({ id, data: values }) : await createSupplySource.mutateAsync({ data: values });
        queryClient.invalidateQueries({ queryKey: getListSupplySourcesQueryKey() });
      }
      toast({ title: "Đã lưu thành công" });
    } catch (e) {
      toast({ title: "Đã xảy ra lỗi", variant: "destructive" });
    }
  };

  const getDialogProps = () => {
    if (dialogState.type === 'employee') return {
      title: dialogState.entity ? "Sửa nhân viên" : "Thêm nhân viên",
      schema: z.object({ name: z.string().min(1), role: z.string().min(1) }),
      fields: [{ name: "name", label: "Tên nhân viên" }, { name: "role", label: "Chức vụ" }]
    };
    if (dialogState.type === 'status') return {
      title: dialogState.entity ? "Sửa trạng thái" : "Thêm trạng thái",
      schema: z.object({ name: z.string().min(1), color: z.string().min(1) }),
      fields: [{ name: "name", label: "Tên trạng thái" }, { name: "color", label: "Màu sắc (Hex)", type: "color" }]
    };
    if (dialogState.type === 'source') return {
      title: dialogState.entity ? "Sửa nguồn khách" : "Thêm nguồn khách",
      schema: z.object({ name: z.string().min(1), description: z.string().optional() }),
      fields: [{ name: "name", label: "Tên nguồn" }, { name: "description", label: "Mô tả" }]
    };
    if (dialogState.type === 'productType') return {
      title: dialogState.entity ? "Sửa loại mặt hàng" : "Thêm loại mặt hàng",
      schema: z.object({ name: z.string().min(1), slug: z.string().optional() }),
      fields: [{ name: "name", label: "Tên loại mặt hàng" }, { name: "slug", label: "Mã (Slug)" }]
    };
    if (dialogState.type === 'supplySource') return {
      title: dialogState.entity ? "Sửa nguồn hàng" : "Thêm nguồn hàng",
      schema: z.object({ name: z.string().min(1), inventoryValue: z.coerce.number().optional() }),
      fields: [{ name: "name", label: "Tên nguồn hàng" }]
    };
    return null;
  };

  const dialogProps = getDialogProps();

  return (
    <MainLayout activeTab="cai-dat">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="flex flex-col h-[calc(100vh-180px)]">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 bg-card z-10">
            <CardTitle className="text-base font-semibold">Quản lý nhân viên</CardTitle>
            <Button size="icon" variant="ghost" onClick={() => setDialogState({ open: true, type: 'employee', entity: null })} className="h-8 w-8 text-emerald-600"><Plus className="w-5 h-5" /></Button>
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
                    <div className="text-xs text-muted-foreground mt-0.5">{e.role}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, type: 'employee', entity: e })} className="h-7 w-7 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                    {!e.isProtected && <Button variant="ghost" onClick={() => handleDelete('employee', e.id, e.name)} size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setDialogState({ open: true, type: 'employee', entity: null })}>+ Thêm nhân viên</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[calc(100vh-180px)]">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 bg-card z-10">
            <CardTitle className="text-base font-semibold">Quản lý trạng thái</CardTitle>
            <Button size="icon" variant="ghost" onClick={() => setDialogState({ open: true, type: 'status', entity: null })} className="h-8 w-8 text-emerald-600"><Plus className="w-5 h-5" /></Button>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            <div className="divide-y">
              {statuses?.map(s => (
                <div key={s.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      {s.isSystem && <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 border-primary/20 text-primary/70">Trạng thái hệ thống</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, type: 'status', entity: s })} className="h-7 w-7 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                    {!s.isSystem && <Button variant="ghost" onClick={() => handleDelete('status', s.id, s.name)} size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setDialogState({ open: true, type: 'status', entity: null })}>+ Thêm trạng thái</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[calc(100vh-180px)]">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 bg-card z-10">
            <CardTitle className="text-base font-semibold">Quản lý nguồn khách</CardTitle>
            <Button size="icon" variant="ghost" onClick={() => setDialogState({ open: true, type: 'source', entity: null })} className="h-8 w-8 text-emerald-600"><Plus className="w-5 h-5" /></Button>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            <div className="divide-y">
              {sources?.map(s => (
                <div key={s.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1.5">
                      {s.name}
                    </div>
                    {s.description && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">{s.description}</div>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, type: 'source', entity: s })} className="h-7 w-7 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" onClick={() => handleDelete('source', s.id, s.name)} size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setDialogState({ open: true, type: 'source', entity: null })}>+ Thêm nguồn khách</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 h-[calc(100vh-180px)]">
          <Card className="flex flex-col flex-1 min-h-0">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 bg-card z-10">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Tag className="w-4 h-4" /> Loại mặt hàng</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {productTypes?.map(pt => (
                  <div key={pt.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium text-sm">{pt.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{pt.slug}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, type: 'productType', entity: pt })} className="h-7 w-7 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" onClick={() => handleDelete('productType', pt.id, pt.name)} size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setDialogState({ open: true, type: 'productType', entity: null })}>+ Thêm loại mặt hàng</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col flex-1 min-h-0">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 bg-card z-10">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Nguồn hàng</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {supplySources?.map(ss => (
                  <div key={ss.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium text-sm">{ss.name}</div>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, type: 'supplySource', entity: ss })} className="h-7 w-7 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" onClick={() => handleDelete('supplySource', ss.id, ss.name)} size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-9" onClick={() => setDialogState({ open: true, type: 'supplySource', entity: null })}>+ Thêm nguồn hàng</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {dialogState.open && dialogProps && (
        <GenericDialog 
          open={dialogState.open} 
          onOpenChange={(open) => setDialogState({ ...dialogState, open })}
          title={dialogProps.title}
          entity={dialogState.entity}
          schema={dialogProps.schema}
          fields={dialogProps.fields}
          onSubmit={handleSubmit}
        />
      )}
    </MainLayout>
  );
}
