import { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";

export default function InventoryIndex({ items, filters, categories }) {
    const safeItems = items ?? { data: [], links: [] };
    const rows = safeItems.data ?? [];
    const links = safeItems.links ?? [];
    const categoryList = categories ?? [];

    const [search, setSearch] = useState(filters?.search || "");
    const [category, setCategory] = useState(filters?.category || "");
    const [editing, setEditing] = useState(null);
    const [dirtyRows, setDirtyRows] = useState({});
    const [showVariants, setShowVariants] = useState(true);

    useEffect(() => {
        const delay = setTimeout(() => {
            router.get("/admin/inventory", { search, category }, { preserveState: true });
        }, 500);
        return () => clearTimeout(delay);
    }, [search, category]);

    const formatRupiah = number =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })
            .format(number)
            .replace(",00", "");

    const save = row => {
        router.put(`/admin/inventory/${row.variant_id ?? row.product_id}`, {
            type: row.type,
            price: row.price,
            stock: row.stock,
        });

        setDirtyRows({});
        setEditing(null);
    };

    const trackChange = id => setDirtyRows(p => ({ ...p, [id]: true }));

    const filteredRows = showVariants ? rows : rows.filter(r => r.type === "product");

    return (
        <AppLayout
            title="Product Inventory"
            breadcrumbs={[
                { title: "Home", href: "/" },
                { title: "Inventory", href: "/admin/inventory" },
            ]}
        >
            <Head title="Inventory" />

            <div className="p-6 text-gray-900 dark:text-gray-100">
                <h1 className="text-xl font-bold mb-4">Product Inventory</h1>

                <div className="flex gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Search product, variant, sku, category..."
                        className="border p-2 flex-1 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />

                    <select
                        className="border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categoryList.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <button
                        className="px-4 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        onClick={() => setShowVariants(!showVariants)}
                    >
                        {showVariants ? "Hide Variants" : "Show Variants"}
                    </button>
                </div>

                <table className="min-w-full border dark:border-gray-700 dark:bg-gray-900">
                    <thead className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
                        <tr>
                            <th className="p-2 border dark:border-gray-700">Type</th>
                            <th className="p-2 border dark:border-gray-700">Name</th>
                            <th className="p-2 border dark:border-gray-700">SKU</th>
                            <th className="p-2 border dark:border-gray-700">Category</th>
                            <th className="p-2 border dark:border-gray-700">Price</th>
                            <th className="p-2 border dark:border-gray-700">Stock</th>
                            <th className="p-2 border dark:border-gray-700 w-24">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredRows.map(row => {
                            const id = row.variant_id ?? row.product_id;

                            return (
                                <tr
                                    key={`${row.type}-${id}`}
                                    className={`border-b dark:border-gray-700 ${dirtyRows[id] ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
                                >
                                    <td className="p-2 border dark:border-gray-700">{row.type}</td>
                                    <td className="p-2 border dark:border-gray-700">{row.name}</td>
                                    <td className="p-2 border dark:border-gray-700">{row.sku || "-"}</td>
                                    <td className="p-2 border dark:border-gray-700">{row.category_name}</td>

                                    <td className="p-2 border dark:border-gray-700">
                                        {editing === id ? (
                                            <input
                                                type="number"
                                                defaultValue={row.price}
                                                className="border p-1 w-full bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                                onChange={e => {
                                                    row.price = e.target.value;
                                                    trackChange(id);
                                                }}
                                            />
                                        ) : (
                                            formatRupiah(row.price)
                                        )}
                                    </td>

                                    <td className="p-2 border dark:border-gray-700">
                                        {editing === id ? (
                                            <input
                                                type="number"
                                                defaultValue={row.stock}
                                                className="border p-1 w-full bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                                onChange={e => {
                                                    row.stock = e.target.value;
                                                    trackChange(id);
                                                }}
                                            />
                                        ) : (
                                            row.stock
                                        )}
                                    </td>

                                    <td className="p-2 border dark:border-gray-700 text-center">
                                        {editing === id ? (
                                            <button
                                                className="bg-green-600 text-white px-3 py-1 rounded"
                                                onClick={() => save(row)}
                                            >
                                                Save
                                            </button>
                                        ) : (
                                            <button
                                                className="bg-blue-600 text-white px-3 py-1 rounded"
                                                onClick={() => setEditing(id)}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="mt-4 flex justify-center">
                    {links.map((link, idx) => (
                        <button
                            key={idx}
                            disabled={!link.url}
                            onClick={() => link.url && router.get(link.url)}
                            className={`px-3 py-1 mx-1 border rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 ${link.active ? "bg-gray-800 text-white dark:bg-gray-600" : "bg-white dark:bg-gray-800"} ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}