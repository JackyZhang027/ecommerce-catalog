import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import CrudDataTable from "@/components/crud/CrudDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Product } from "@/types/product";
import { Switch } from "@/components/ui/switch";

interface Props {
    products: {
        data: Product[];
        links: any[];
        meta: any;
    };
    filters: Record<string, any>;
}

export default function Index({ products, filters }: Props) {
    const columns: ColumnDef<Product>[] = [
        { accessorKey: "name", header: "Name" },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => {
                const value = row.description || "";
                const truncated =
                    value.length > 50 ? value.substring(0, 50) + "..." : value;
                return <span title={value}>{truncated}</span>;
            },
        },
        {
            accessorKey: "price",
            header: "Price",
            cell: ({ row }) => {
                const value = row.price
                const formatted = Number(value).toLocaleString("id-ID"); // Indonesian format
                return <span>Rp. {formatted}</span>;
            },
        },
        {
            accessorKey: "stock",
            header: "Stock",
            cell: ({ row }) => {
                const value = row.stock;
                return <span>{Number(value).toLocaleString("id-ID")}</span>;
            },
        },
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
                                route("products.toggle", record.id),
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
            title="Products"
            breadcrumbs={[
                { title: "Home", href: route("admin.home") },
                { title: "Products", href: route("products.index") },
            ]}
        >
            <Head title="Product products" />

            <CrudDataTable<Product>
                title="Product products"
                data={products.data}
                meta={products.meta}
                filters={filters}
                columns={columns}
                baseIndexRoute={route("products.index")}
                createPage={route('products.create')}
                deleteRoute={route('products.destroy', ':id')}
                editPage="products"
            />
        </AppLayout>
    );
}
