import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import CrudDataTable from "@/components/crud/CrudDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ProductCategory } from "@/types/product-category";
import { Switch } from "@/components/ui/switch";

interface Props {
  categories: {
    data: ProductCategory[];
    links: any[];
    meta: any;
  };
  filters: Record<string, any>;
}

export default function Index({ categories, filters }: Props) {
  const columns: ColumnDef<ProductCategory>[] = [
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
              route("categories.toggle", record.id),
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
      title="Product Categories"
      breadcrumbs={[
        { title: "Home", href: route("admin.home") },
        { title: "Categories", href: route("categories.index") },
      ]}
    >
      <Head title="Product Categories" />

      <CrudDataTable<ProductCategory>
        title="Product Categories"
        data={categories.data}
        meta={categories.meta}
        filters={filters}
        columns={columns}
        baseIndexRoute={route("categories.index")}
        createPage={route('categories.create')}
        editPage="categories"
      />
    </AppLayout>
  );
}
