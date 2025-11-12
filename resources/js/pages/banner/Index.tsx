import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import CrudDataTable from "@/components/crud/CrudDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Banner } from "@/types/banner";
import { Switch } from "@/components/ui/switch";

interface Props {
  banners: {
    data: Banner[];
    links: any[];
    meta: any;
  };
  filters: Record<string, any>;
}

export default function Index({ banners, filters }: Props) {
  const columns: ColumnDef<Banner>[] = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "subtitle", header: "Subtitle" },
  { accessorKey: "button_text", header: "Button Text" },
  { accessorKey: "button_link", header: "Button Link" },
  { accessorKey: "order", header: "Order" },
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
              route("banners.toggle", record.id),
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
      title="Banners"
      breadcrumbs={[
        { title: "Home", href: route("admin.home") },
        { title: "banners", href: route("banners.index") },
      ]}
    >
      <Head title="Banners" />

      <CrudDataTable<Banner>
        title="Banners"
        data={banners.data}
        meta={banners.meta}
        filters={filters}
        columns={columns}
        baseIndexRoute={route("banners.index")}
        createPage={route('banners.create')}
        editPage="banners"
        deleteRoute={route("banners.destroy", ":id")}
      />
    </AppLayout>
  );
}
