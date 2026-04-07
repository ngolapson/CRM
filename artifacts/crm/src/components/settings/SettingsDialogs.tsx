import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DialogField {
  name: string;
  label: string;
  type?: string;
}

interface GenericDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entity: object | null;
  schema: z.ZodTypeAny;
  fields: DialogField[];
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

export function GenericDialog({
  open, onOpenChange, title, entity, schema, fields, onSubmit,
}: GenericDialogProps) {
  const entityRecord = entity as Record<string, unknown> | null;
  const defaultValues = entityRecord
    ? Object.fromEntries(Object.entries(entityRecord).map(([k, v]) => [k, v ?? ""]))
    : fields.reduce<Record<string, string>>((acc, f) => ({ ...acc, [f.name]: "" }), {});

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
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
                      {field.type === "color" ? (
                        <Input type="color" className="h-10 p-1 w-full" {...formField} value={String(formField.value ?? "#6b7280")} />
                      ) : field.type === "number" ? (
                        <Input type="number" {...formField} value={String(formField.value ?? "")} />
                      ) : field.type === "password" ? (
                        <Input type="password" placeholder={`Nhập ${field.label.toLowerCase()}...`} {...formField} value={String(formField.value ?? "")} />
                      ) : (
                        <Input placeholder={`Nhập ${field.label.toLowerCase()}...`} {...formField} value={String(formField.value ?? "")} />
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
