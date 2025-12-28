import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import CrudDataTable from "@/components/crud/CrudDataTable";
import { ColumnDef } from "@tanstack/react-table";

interface Purchase {
  id: number;
  reference: string;
  purchase_date: string;
  total: number;
  supplier?: { name: string };
}

export default function Index({ purchases, filters }: any) {
  const columns: ColumnDef<Purchase>[] = [
    { accessorKey: "reference", header: "Reference" },
    {
      header: "Supplier",
      cell: ({ row }) => row.supplier?.name ?? "-",
    },
    { accessorKey: "purchase_date", header: "Date" },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
            const value = row.total
            const formatted = Number(value).toLocaleString("id-ID"); // Indonesian format
            return <span>Rp. {formatted}</span>;
        },
    },
  ];

  return (
    <AppLayout title="Purchases">
      <Head title="Purchases" />

      <CrudDataTable<Purchase>
            title="Purchases"
            data={purchases.data}
            meta={purchases.meta}
            filters={filters}
            columns={columns}
            baseIndexRoute={route("purchases.index")}
            createPage={route('purchases.create')}
            deleteRoute={route('purchases.destroy', ':id')}
            editPage="purchases"
        />
    </AppLayout>
  );
}
