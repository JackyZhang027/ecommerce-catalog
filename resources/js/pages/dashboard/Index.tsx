import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";

/* =====================
UTILS
===================== */
function currency(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
    }).format(value || 0);
}

/* =====================
DASHBOARD
===================== */
export default function Dashboard({
    metrics,
    charts,
    top_sales,
    top_profit_products,
    top_loss_products,
    variant_stats,
    low_stock,
    filters,
}) {
    const [period, setPeriod] = useState(filters?.period || "this_month");
    const [from, setFrom] = useState(filters?.from || "");
    const [to, setTo] = useState(filters?.to || "");

    const applyFilter = () => {
        router.get(
            route("dashboard"),
            { period, from, to },
            { preserveState: true }
        );
    };

    return (
        <AppLayout>
            <Head title="Dashboard" />

            {/* ================= FILTERS ================= */}
            <div className="mb-6 flex flex-wrap gap-3 items-end px-4 py-3">
                <select
                    className="border rounded px-3 py-2
                        bg-white dark:bg-gray-800
                        text-gray-900 dark:text-gray-100
                        border-gray-300 dark:border-gray-600"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                >
                    <option value="today">Today</option>
                    <option value="this_month">This Month</option>
                    <option value="custom">Custom Range</option>
                </select>

                {period === "custom" && (
                    <>
                        <input
                            type="date"
                            className="border rounded px-3 py-2
                                bg-white dark:bg-gray-800
                                text-gray-900 dark:text-gray-100
                                border-gray-300 dark:border-gray-600"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                        <input
                            type="date"
                            className="border rounded px-3 py-2
                                bg-white dark:bg-gray-800
                                text-gray-900 dark:text-gray-100
                                border-gray-300 dark:border-gray-600"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </>
                )}

                <button
                    onClick={applyFilter}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                    Apply
                </button>
            </div>

            {/* ================= KPI CARDS ================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8 px-4">
                <Kpi title="Total Sales" value={metrics.total_sales} />
                <Kpi title="COGS (FIFO)" value={metrics.total_cogs} />
                <Kpi title="Profit" value={metrics.profit} highlight />
                <Kpi title="Profit Margin" value={`${metrics.profit_margin}%`} />
                <Kpi title="Total Purchases" value={metrics.total_purchases} />
                <Kpi title="Stock On Hand" value={metrics.total_stock} />
            </div>

            {/* ================= SALES & PROFIT ================= */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-8 mx-4 p-4">
                <div className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    Sales & Profit
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">
                                    Date
                                </th>
                                <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">
                                    Sales
                                </th>
                                <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">
                                    Profit
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {charts.sales_profit.map((r, i) => (
                                <tr
                                    key={i}
                                    className="border-t border-gray-200 dark:border-gray-700"
                                >
                                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                        {r.date}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200">
                                        {currency(r.sales)}
                                    </td>
                                    <td
                                        className={`px-3 py-2 text-right ${
                                            r.profit < 0
                                                ? "text-red-600 dark:text-red-400"
                                                : "text-green-600 dark:text-green-400"
                                        }`}
                                    >
                                        {currency(r.profit)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= TOP TABLES ================= */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 px-4 mb-8">
                <Table
                    title="Top Selling Products"
                    headers={["Product", "Qty", "Sales"]}
                    rows={top_sales.map((p) => [
                        p.name,
                        p.total_qty,
                        currency(p.total_sales),
                    ])}
                />

                <Table
                    title="Top Profit Products"
                    headers={["Product", "Sales", "COGS", "Profit"]}
                    rows={top_profit_products.map((p) => [
                        p.name,
                        currency(p.sales),
                        currency(p.cogs),
                        currency(p.profit),
                    ])}
                />
            </div>

            {/* ================= LOSS & LOW STOCK ================= */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 px-4 mb-8">
                <Table
                    title="Top Loss Products"
                    headers={["Product", "Profit"]}
                    rows={top_loss_products.map((p) => [
                        p.name,
                        <span className="text-red-600 dark:text-red-400">
                            {currency(p.profit)}
                        </span>,
                    ])}
                />

                <Table
                    title="Low Stock Alert"
                    headers={["Product", "Variant", "Stock"]}
                    rows={low_stock.map((s) => [
                        s.product,
                        s.variant || "-",
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                            {s.stock}
                        </span>,
                    ])}
                />
            </div>

            {/* ================= VARIANT PERFORMANCE ================= */}
            <div className="px-4 mb-10">
                <Table
                    title="Variant Performance"
                    headers={["Product", "Variant", "Qty Sold", "Profit"]}
                    rows={variant_stats.map((v) => [
                        v.product,
                        v.variant,
                        v.qty_sold,
                        currency(v.profit),
                    ])}
                />
            </div>
        </AppLayout>
    );
}

/* =====================
COMPONENTS
===================== */

function Kpi({ title, value, highlight }) {
    return (
        <div
            className={`rounded-xl p-4 shadow
                ${
                    highlight
                        ? "bg-green-50 dark:bg-green-900/30"
                        : "bg-white dark:bg-gray-800"
                }
            `}
        >
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {title}
            </div>
            <div className="text-2xl font-semibold mt-1 text-gray-900 dark:text-gray-100">
                {typeof value === "string" && value.endsWith("%")
                    ? value
                    : currency(value)}
            </div>
        </div>
    );
}

function Table({ title, headers, rows }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-gray-100">
                {title}
            </div>

            <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                className="text-left px-4 py-2 text-gray-600 dark:text-gray-300"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.length === 0 && (
                        <tr>
                            <td
                                colSpan={headers.length}
                                className="px-4 py-6 text-center text-gray-400 dark:text-gray-500"
                            >
                                No data
                            </td>
                        </tr>
                    )}

                    {rows.map((row, i) => (
                        <tr
                            key={i}
                            className="border-t border-gray-200 dark:border-gray-700"
                        >
                            {row.map((cell, j) => (
                                <td
                                    key={j}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-200"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
