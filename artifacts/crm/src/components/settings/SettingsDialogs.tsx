import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  useCreateEmployee, useUpdateEmployee, Employee,
  useCreateCustomerStatus, useUpdateCustomerStatus, CustomerStatus,
  useCreateCustomerSource, useUpdateCustomerSource, CustomerSource,
  useCreateProductType, useUpdateProductType, ProductType,
  useCreateSupplySource, useUpdateSupplySource, SupplySource,
  getListEmployeesQueryKey, getListCustomerStatusesQueryKey, getListCustomerSourcesQueryKey,
  getListProductTypesQueryKey, getListSupplySourcesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

export function GenericDialog({ 
  open, onOpenChange, title, entity, schema, fields, onSubmit 
}: { 
  open: boolean; onOpenChange: (open: boolean) => void; title: string; 
  entity: any; schema: z.ZodSchema<any>; fields: { name: string, label: string, type?: string }[];
  onSubmit: (values: any) => Promise<void>;
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: entity || fields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
  });

  const handleSubmit = async (values: any) => {
    await onSubmit(values);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {fields.map(field => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      {field.type === 'color' ? (
                        <Input type="color" className="h-10 p-1 w-full" {...formField} />
                      ) : field.type === 'number' ? (
                        <Input type="number" {...formField} />
                      ) : (
                        <Input placeholder={`Nhập ${field.label.toLowerCase()}...`} {...formField} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
