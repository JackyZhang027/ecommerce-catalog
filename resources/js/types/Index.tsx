import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import CrudDataTable from "@/components/crud/CrudDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Attributes } from "@/types/attributes";
import { Switch } from "@/components/ui/switch";

interface Props {
  attributes: {
    data: Attributes[];
    links: any[];
    meta: any;
  };
  filters: Record<string, any>;
}

export default function Index({ attributes, filters }: Props) {
  const columns: ColumnDef<Attributes>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "is_active",
    header: "Active",
    cell: ({ row }) => {
      const record = row;
      return (
        <Switch
          checked={record.is_active}
          onCheckedChange={(checked) =>
            router.put(
              route("attributes.toggle", record.id),
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
      title="Product attributes"
      breadcrumbs={[
        { title: "Home", href: route("admin.home") },
        { title: "attributes", href: route("attributes.index") },
      ]}
    >
      <Head title="Product attributes" />

      <CrudDataTable<Attributes>
        title="Product attributes"
        data={attributes.data}
        meta={attributes.meta}
        filters={filters}
        columns={columns}
        baseIndexRoute={route("attributes.index")}
        createPage={route('attributes.create')}
        editPage="attributes"
        deleteRoute={route('attributes.destroy', ':id')}
      />
    </AppLayout>
  );
}
