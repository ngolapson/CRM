import { format, parseISO } from "date-fns";

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0";
  return value.toLocaleString("vi-VN");
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "-";
  try {
    return format(parseISO(dateString), "dd/MM/yyyy");
  } catch (e) {
    return dateString;
  }
}

export function formatCustomerCode(name: string, id: number): string {
  return `KH${id} - ${name}`;
}
