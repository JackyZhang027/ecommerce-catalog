import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import CrudDataTable from "@/components/crud/CrudDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

interface Props {
  suppliers: {
    data: Supplier[];
    links: any[];
    meta: any;
  };
  filters: Record<string, any>;
}

export default function Index({ suppliers, filters }: Props) {
  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.name}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) =>
        row.email ? (
          row.email
        ) : (
          <Badge variant="secondary">N/A</Badge>
        ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) =>
        row.phone ? (
          row.phone
        ) : (
          <Badge variant="secondary">N/A</Badge>
        ),
    },
    {
      accessorKey: "is_active",
      header: "Active",
      cell: ({ row }) => {
        const supplier = row;

        return (
          <Switch
            checked={supplier.is_active}
            onCheckedChange={(checked) =>
              router.put(
                route("suppliers.toggle", supplier.id),
                { is_active: checked },
                { preserveScroll: true }
              )
            }
          />
        );
      },
    },
  ];

  return (
    <AppLayout
      title="Suppliers"
      breadcrumbs={[
        { title: "Home", href: route("admin.home") },
        { title: "Suppliers", href: route("suppliers.index") },
      ]}
    >
      <Head title="Suppliers" />

      <CrudDataTable<Supplier>
        title="Suppliers"
        data={suppliers.data}
        meta={suppliers.meta}
        filters={filters}
        columns={columns}
        baseIndexRoute={route("suppliers.index")}
        createPage={route("suppliers.create")}
        editPage="suppliers"
        deleteRoute={route("suppliers.destroy", ":id")}
      />
    </AppLayout>
  );
}
