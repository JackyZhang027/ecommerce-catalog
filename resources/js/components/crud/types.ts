import { ColumnDef } from "@tanstack/react-table";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "email";
}

export interface CrudTableProps<T> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  createRoute: string;
  exportRoute?: string;
  formFields: FormField[];
}
