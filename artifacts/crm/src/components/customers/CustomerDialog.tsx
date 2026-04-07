import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { 
  useListEmployees,
  useListCustomerStatuses,
  useListCustomerSources,
  useListProductTypes,
  useListSupplySources,
  useListProducts,
  useCreateCustomer,
  useUpdateCustomer,
  Customer,
  getListCustomersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const orderSchema = z.object({
  closedAt: z.string().optional().nullable(),
  orderCode: z.string().optional().nullable(),
  productTypeId: z.coerce.number().optional().nullable(),
  supplySourceId: z.coerce.number().optional().nullable(),
  productId: z.coerce.number().optional().nullable(),
  customProductName: z.string().optional().nullable(),
  revenue: z.coerce.number().min(0),
  profit: z.coerce.number(),
  warrantyMonths: z.coerce.number().optional().nullable(),
  note: z.string().optional().nullable(),
});

const customerSchema = z.object({
  createdAt: z.string().optional().nullable(),
  name: z.string().min(1, "Tên khách hàng là bắt buộc"),
  phone: z.string().min(1, "Số điện thoại là bắt buộc"),
  address: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  statusId: z.coerce.number().min(1, "Vui lòng chọn trạng thái"),
  employeeId: z.coerce.number().min(1, "Vui lòng chọn người phụ trách"),
  sourceId: z.coerce.number().optional().nullable(),
  lastContactAt: z.string().optional().nullable(),
  nextContactAt: z.string().optional().nullable(),
  orders: z.array(orderSchema).optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export function CustomerDialog({ 
  open, 
  onOpenChange,
  customer
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statuses } = useListCustomerStatuses();
  const { data: employees } = useListEmployees();
  const { data: sources } = useListCustomerSources();
  const { data: productTypes } = useListProductTypes();
  const { data: supplySources } = useListSupplySources();
  const { data: products } = useListProducts();

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      note: customer.note,
      statusId: customer.statusId,
      employeeId: customer.employeeId,
      sourceId: customer.sourceId,
      createdAt: customer.createdAt?.substring(0, 10),
      lastContactAt: customer.lastContactAt?.substring(0, 10),
      nextContactAt: customer.nextContactAt?.substring(0, 10),
      orders: [], 
    } : {
      name: "",
      phone: "",
      address: "",
      note: "",
      statusId: undefined,
      employeeId: undefined,
      sourceId: undefined,
      createdAt: new Date().toISOString().substring(0, 10),
      orders: [],
    }
  });

  const { fields: orderFields, append: appendOrder, remove: removeOrder } = useFieldArray({
    control: form.control,
    name: "orders"
  });

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      if (customer) {
        await updateCustomer.mutateAsync({ id: customer.id, data: values });
        toast({ title: "Đã cập nhật khách hàng" });
      } else {
        await createCustomer.mutateAsync({ data: values });
        toast({ title: "Đã thêm khách hàng mới" });
      }
      queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({ title: "Lỗi", description: "Đã xảy ra lỗi khi lưu khách hàng", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "Sửa khách hàng" : "Thêm khách hàng mới"}</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết khách hàng và các đơn hàng liên quan
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="createdAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NGÀY TẠO</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TÊN KHÁCH HÀNG *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SỐ ĐIỆN THOẠI *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập SĐT..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GHI CHÚ</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ghi chú về khách hàng..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ĐỊA CHỈ</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Địa chỉ khách hàng..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="statusId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TRẠNG THÁI *</FormLabel>
                    <Select value={field.value?.toString()} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NGƯỜI PHỤ TRÁCH *</FormLabel>
                    <Select value={field.value?.toString()} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhân viên" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sourceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NGUỒN KHÁCH</FormLabel>
                    <Select value={field.value?.toString()} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nguồn" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sources?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastContactAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LIÊN HỆ GẦN NHẤT</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nextContactAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NGÀY LIÊN HỆ TIẾP</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!customer && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-amber-600 uppercase">Thông tin đơn hàng</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => appendOrder({ revenue: 0, profit: 0 })}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Thêm đơn hàng
                  </Button>
                </div>
                
                {orderFields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-border rounded-lg bg-muted/20 relative space-y-4 mt-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 text-destructive z-10"
                      onClick={() => removeOrder(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`orders.${index}.closedAt`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NGÀY CHỐT *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`orders.${index}.orderCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MÃ ĐƠN HÀNG</FormLabel>
                            <FormControl>
                              <Input placeholder="Mã đơn..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`orders.${index}.productTypeId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LOẠI MẶT HÀNG</FormLabel>
                            <Select value={field.value?.toString()} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn loại" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {productTypes?.map(pt => <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`orders.${index}.supplySourceId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NGUỒN HÀNG</FormLabel>
                            <Select value={field.value?.toString()} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn nguồn hàng" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {supplySources?.map(ss => <SelectItem key={ss.id} value={ss.id.toString()}>{ss.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`orders.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SẢN PHẨM TỪ KHO (TRỪ TỒN)</FormLabel>
                            <Select value={field.value?.toString()} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn sản phẩm" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`orders.${index}.customProductName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>TÊN MẶT HÀNG / GÓI</FormLabel>
                            <FormControl>
                              <Input placeholder="Tên sản phẩm tự nhập..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`orders.${index}.revenue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DOANH THU</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`orders.${index}.profit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LỢI NHUẬN</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name={`orders.${index}.warrantyMonths`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BẢO HÀNH (THÁNG)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`orders.${index}.note`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LỜI GHI CHÚ ĐƠN HÀNG</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Ghi chú đơn hàng..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending}>
                Lưu khách hàng
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
