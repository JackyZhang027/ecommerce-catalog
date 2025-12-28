import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import CrudDataTable from "@/components/crud/CrudDataTable";
import { ColumnDef } from "@tanstack/react-table";

interface Sale {
  id: number;
  reference: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  total: number;
}

export default function Index({ sales, filters }: any) {
  const columns: ColumnDef<Sale>[] = [
    { accessorKey: "reference", header: "Reference" },
    { accessorKey: "sale_date", header: "Date" },
    {
      accessorKey: "subtotal",
      header: "Subtotal",
      cell: ({ row }) => {
        const value = row.subtotal;
        return <span>Rp. {Number(value).toLocaleString("id-ID")}</span>;
      },
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => {
        const value = row.discount;
        return <span>Rp. {Number(value).toLocaleString("id-ID")}</span>;
      },
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const value = row.total;
        return (
          <span className="font-semibold">
            Rp. {Number(value).toLocaleString("id-ID")}
          </span>
        );
      },
    },
  ];

  return (
    <AppLayout title="Sales">
      <Head title="Sales" />

      <CrudDataTable<Sale>
        title="Sales"
        data={sales.data}
        meta={sales.meta}
        filters={filters}
        columns={columns}
        baseIndexRoute={route("sales.index")}
        createPage={route("sales.create")}
        editPage="sales"
        deleteRoute={route("sales.destroy", ":id")}
      />
    </AppLayout>
  );
}
