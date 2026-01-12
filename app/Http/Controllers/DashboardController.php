<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        /* =========================
        TOTAL SALES (REVENUE)
        ========================= */
        $salesQuery = DB::table('sale_items')
            ->selectRaw('COALESCE(SUM(sale_items.subtotal), 0) as total');

        $this->applyDateFilter($salesQuery, $request, 'sale_items.created_at');
        $totalSales = $salesQuery->value('total');

        /* =========================
        FIFO COST OF GOODS SOLD
        ========================= */
        $cogsQuery = DB::table('sale_item_batches')
            ->selectRaw('COALESCE(SUM(sale_item_batches.qty * sale_item_batches.cost), 0) as total');

        $this->applyDateFilter($cogsQuery, $request, 'sale_item_batches.created_at');
        $totalCogs = $cogsQuery->value('total');

        /* =========================
        PROFIT
        ========================= */
        $profit = $totalSales - $totalCogs;

        /* =========================
        TOTAL PURCHASE VALUE
        ========================= */
        $purchaseQuery = DB::table('purchase_items')
            ->selectRaw('COALESCE(SUM(purchase_items.subtotal), 0) as total');

        $this->applyDateFilter($purchaseQuery, $request, 'purchase_items.created_at');
        $totalPurchases = $purchaseQuery->value('total');

        /* =========================
        TOTAL STOCK (FIFO)
        ========================= */
        $totalStock = DB::table('stock_batches')
            ->selectRaw('COALESCE(SUM(qty_in - qty_out), 0) as total')
            ->value('total');

        /* =========================
        TOP SELLING PRODUCTS
        ========================= */
        $topSalesQuery = DB::table('sale_items')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sale_items.qty) as total_qty'),
                DB::raw('SUM(sale_items.subtotal) as total_sales')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_qty')
            ->limit(5);

        $this->applyDateFilter($topSalesQuery, $request, 'sale_items.created_at');
        $topSales = $topSalesQuery->get();

        /* =========================
        TOP PROFIT PRODUCTS (FIFO)
        ========================= */
        $profitByProductQuery = DB::table('sale_items')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('sale_item_batches', 'sale_item_batches.sale_item_id', '=', 'sale_items.id')
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sale_items.subtotal) as sales'),
                DB::raw('COALESCE(SUM(sale_item_batches.qty * sale_item_batches.cost), 0) as cogs'),
                DB::raw('SUM(sale_items.subtotal) - COALESCE(SUM(sale_item_batches.qty * sale_item_batches.cost), 0) as profit')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('profit')
            ->limit(5);

        $this->applyDateFilter($profitByProductQuery, $request, 'sale_items.created_at');
        $profitByProduct = $profitByProductQuery->get();

        /* =========================
        SALES & PROFIT CHART
        ========================= */
        $chartQuery = DB::table('sale_items')
            ->leftJoin('sale_item_batches', 'sale_item_batches.sale_item_id', '=', 'sale_items.id')
            ->selectRaw("
                DATE(sale_items.created_at) as date,
                SUM(sale_items.subtotal) as sales,
                COALESCE(SUM(sale_item_batches.qty * sale_item_batches.cost), 0) as cogs,
                SUM(sale_items.subtotal) - COALESCE(SUM(sale_item_batches.qty * sale_item_batches.cost), 0) as profit
            ")
            ->groupByRaw('DATE(sale_items.created_at)')
            ->orderBy('date');

        $this->applyDateFilter($chartQuery, $request, 'sale_items.created_at');

        $salesChart = $chartQuery->get();

        $profitMargin = $totalSales > 0
                        ? round(($profit / $totalSales) * 100, 2)
                        : 0;

        $variantStats = DB::table('sale_items')
                        ->join('product_variants', 'product_variants.id', '=', 'sale_items.product_variant_id')
                        ->join('products', 'products.id', '=', 'sale_items.product_id')
                        ->leftJoin('sale_item_batches', 'sale_item_batches.sale_item_id', '=', 'sale_items.id')
                        ->select(
                            'products.name as product',
                            'product_variants.name as variant',
                            DB::raw('SUM(sale_items.qty) as qty_sold'),
                            DB::raw('SUM(sale_items.subtotal) as sales'),
                            DB::raw('COALESCE(SUM(sale_item_batches.qty * sale_item_batches.cost), 0) as cogs'),
                            DB::raw('SUM(sale_items.subtotal) - COALESCE(SUM(sale_item_batches.qty * sale_item_batches.cost), 0) as profit')
                        )
                        ->groupBy('products.name', 'product_variants.name')
                        ->orderByDesc('sales');

                    $this->applyDateFilter($variantStats, $request, 'sale_items.created_at');

                    $variantStats = $variantStats->limit(10)->get();

        $lowStockThreshold = 10;

        $lowStockProducts = DB::table('stock_batches')
            ->join('products', 'products.id', '=', 'stock_batches.product_id')
            ->leftJoin('product_variants', 'product_variants.id', '=', 'stock_batches.product_variant_id')
            ->select(
                'products.name as product',
                'product_variants.name as variant',
                DB::raw('SUM(qty_in - qty_out) as stock')
            )
            ->groupBy('products.name', 'product_variants.name')
            ->havingRaw('SUM(qty_in - qty_out) <= ?', [$lowStockThreshold])
            ->orderBy('stock')
            ->get();
        
        $topLossProducts = DB::table('sale_items')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('sale_item_batches', 'sale_item_batches.sale_item_id', '=', 'sale_items.id')
            ->select(
                'products.name',
                DB::raw('SUM(sale_items.subtotal) as sales'),
                DB::raw('COALESCE(SUM(sale_item_batches.qty * sale_item_batches.cost), 0) as cogs'),
                DB::raw('SUM(sale_items.subtotal) - COALESCE(SUM(sale_item_batches.qty * sale_item_batches.cost), 0) as profit')
            )
            ->groupBy('products.name')
            ->havingRaw('profit < 0')
            ->orderBy('profit')
            ->limit(5);

        $this->applyDateFilter($topLossProducts, $request, 'sale_items.created_at');

        $topLossProducts = $topLossProducts->get();


        return inertia('dashboard/Index', [
            'metrics' => [
                'total_sales' => $totalSales,
                'total_cogs' => $totalCogs,
                'profit' => $profit,
                'profit_margin' => $profitMargin,
                'total_purchases' => $totalPurchases,
                'total_stock' => $totalStock,
            ],
            'charts' => [
                'sales_profit' => $salesChart,
            ],
            'top_sales' => $topSales,
            'top_profit_products' => $profitByProduct,
            'top_loss_products' => $topLossProducts,
            'variant_stats' => $variantStats,
            'low_stock' => $lowStockProducts,
            'filters' => $request->only(['period', 'from', 'to']),
        ]);

    }

    /* =========================
    DATE FILTER HELPER
    ========================= */
    private function applyDateFilter($query, Request $request, string $column)
    {
        if ($request->period === 'today') {
            $query->whereDate($column, now());
        }

        if ($request->period === 'this_month') {
            $query->whereMonth($column, now()->month)
                  ->whereYear($column, now()->year);
        }

        if ($request->filled(['from', 'to'])) {
            $query->whereBetween($column, [
                $request->from . ' 00:00:00',
                $request->to . ' 23:59:59',
            ]);
        }

        return $query;
    }
}
