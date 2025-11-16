import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";

export default function InventoryIndex({ items, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [savingId, setSavingId] = useState(null);

    const doSearch = (e) => {
        e.preventDefault();
        router.get("/admin/inventory", { search }, { preserveScroll: true });
    };

    // Auto-save on blur
    const save = (row, field, value) => {
        const id = Number(row.variant_id ?? row.product_id);

        setSavingId(id);

        router.put(
            `/admin/inventory/${id}`,
            {
                type: row.type,
                price: field === "price" ? value : row.price,
                stock: field === "stock" ? value : row.stock,
            },
            {
                preserveScroll: true,
                onFinish: () => setSavingId(null),
            }
        );
    };

    return (
        <AppLayout
            title="Inventory"
            breadcrumbs={[
                { title: "Home", href: "/" },
                { title: "Inventory", href: "/admin/inventory" },
            ]}
        >
            <Head title="Inventory" />

            <div className="p-6">
                <h1 className="text-xl font-bold mb-4">Product Inventory</h1>

                {/* Search Box */}
                <form onSubmit={doSearch} className="mb-4 flex gap-2">
                    <input
                        type="text"
                        placeholder="Search product, variant, sku, category..."
                        className="border p-2 flex-1"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="bg-gray-800 text-white px-4 py-2 rounded">
                        Search
                    </button>
                </form>

                <table className="min-w-full border">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-2 border">Type</th>
                            <th className="p-2 border">Name</th>
                            <th className="p-2 border">SKU</th>
                            <th className="p-2 border">Category</th>
                            <th className="p-2 border">Price</th>
                            <th className="p-2 border">Stock</th>
                        </tr>
                    </thead>

                    <tbody>
                        {items.data.map((row) => {
                            const id = Number(row.variant_id ?? row.product_id);

                            return (
                                <tr key={id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 border text-center text-sm capitalize">
                                        {row.type}
                                    </td>

                                    <td className="p-2 border text-sm">{row.name}</td>

                                    <td className="p-2 border text-sm">
                                        {row.sku || "-"}
                                    </td>

                                    <td className="p-2 border text-sm">
                                        {row.category_name}
                                    </td>

                                    {/* Editable Price */}
                                    <td className="p-2 border">
                                        <input
                                            type="number"
                                            defaultValue={row.price}
                                            className={`border p-1 w-full text-sm rounded ${
                                                savingId === id ? "opacity-50" : ""
                                            }`}
                                            onBlur={(e) =>
                                                save(row, "price", e.target.value)
                                            }
                                        />
                                    </td>

                                    {/* Editable Stock */}
                                    <td className="p-2 border">
                                        <input
                                            type="number"
                                            defaultValue={row.stock}
                                            className={`border p-1 w-full text-sm rounded ${
                                                savingId === id ? "opacity-50" : ""
                                            }`}
                                            onBlur={(e) =>
                                                save(row, "stock", e.target.value)
                                            }
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
