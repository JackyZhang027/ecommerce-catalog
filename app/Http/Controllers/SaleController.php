<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\StockBatch;
use App\Models\Product;
use App\Services\FifoSaleService;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;


class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with('items');

        if ($search = $request->input('search')) {
            $query->where('reference', 'like', "%{$search}%");
        }

        $allowedSorts = ['id', 'reference', 'sale_date', 'total'];

        if ($sort = $request->input('sort')) {
            if (in_array($sort, $allowedSorts)) {
                $query->orderBy($sort, $request->input('direction', 'asc'));
            }
        } else {
            $query->orderBy('id', 'desc');
        }

        $sales = $query
            ->paginate($request->input('per_page', 10))
            ->withQueryString();

        return inertia('sales/Index', [
            'sales' => [
                'data' => $sales->items(),
                'meta' => [
                    'current_page' => $sales->currentPage(),
                    'from' => $sales->firstItem(),
                    'to' => $sales->lastItem(),
                    'total' => $sales->total(),
                    'last_page' => $sales->lastPage(),
                    'links' => $sales->linkCollection(),
                ],
            ],
            'filters' => $request->only(['search', 'sort', 'direction', 'per_page']),
        ]);
    }

    public function create()
    {
        return inertia('sales/Form', [
            'products' => $this->productOptions(),
        ]);
    }

    public function store(Request $request, FifoSaleService $fifoSaleService)
    {
        $validated = $this->validateSale($request);

        try {
            DB::transaction(function () use ($validated, $fifoSaleService) {

                /* =====================
                CALCULATE TOTALS
                ===================== */

                $subtotal = collect($validated['items'])->sum(function ($item) {
                    return ($item['qty'] * $item['price']) - ($item['discount'] ?? 0);
                });

                $discount = $validated['discount'] ?? 0;
                $total = max(0, $subtotal - $discount);

                /* =====================
                CREATE SALE
                ===================== */

                $sale = Sale::create([
                    'reference' => 'SAL-' . now()->format('YmdHis'),
                    'sale_date' => $validated['sale_date'],
                    'subtotal'  => $subtotal,
                    'discount'  => $discount,
                    'total'     => $total,
                    'note'      => $validated['note'] ?? null,
                ]);

                /* =====================
                CREATE ITEMS + FIFO
                ===================== */

                foreach ($validated['items'] as $itemData) {

                    if ($itemData['qty'] <= 0) {
                        throw new \Exception('Invalid quantity.');
                    }

                    $item = $sale->items()->create([
                        'product_id'          => $itemData['product_id'],
                        'product_variant_id' => $itemData['product_variant_id'] ?? null,
                        'qty'                => $itemData['qty'],
                        'price'              => $itemData['price'],
                        'discount'           => $itemData['discount'] ?? 0,
                        'subtotal'          => ($itemData['qty'] * $itemData['price']) - ($itemData['discount'] ?? 0),
                    ]);

                    // 🔒 FIFO stock deduction (throws if insufficient)
                    $fifoSaleService->deduct(
                        $item,
                        $itemData['product_id'],
                        $itemData['product_variant_id'] ?? null,
                        $itemData['qty']
                    );
                }
            });

            return redirect()
                ->route('sales.index')
                ->with('success', 'Sale created successfully.');

        } catch (\Throwable $e) {

            report($e);

            return back()->withErrors([
                'error' => $e->getMessage() ?: 'Failed to create sale.',
            ]);
        }
    }



    public function edit(Sale $sale)
    {
        $sale->load('items');

        $hasStockUsed = StockBatch::whereIn(
            'purchase_item_id',
            $sale->items->pluck('id')->toArray()
        )->where('qty_out', '>', 0)->exists();

        return inertia('sales/Form', [
            'sale' => $sale,
            'hasStockUsed' => $hasStockUsed,
            'products' => $this->productOptions(),
        ]);
    }

    public function update(Request $request, Sale $sale, FifoSaleService $fifo)
    {
        $validated = $this->validateSale($request);

        try {
            DB::transaction(function () use ($sale, $validated, $fifo) {

                /* =====================
                RESTORE OLD FIFO
                ===================== */
                foreach ($sale->items as $oldItem) {
                    $fifo->restore($oldItem);
                }

                $sale->items()->delete();

                /* =====================
                RECALCULATE TOTALS
                ===================== */
                $subtotal = collect($validated['items'])->sum(fn ($i) =>
                    ($i['qty'] * $i['price']) - ($i['discount'] ?? 0)
                );

                $discount = $validated['discount'] ?? 0;
                $total = max(0, $subtotal - $discount);

                $sale->update([
                    'sale_date' => $validated['sale_date'],
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'total' => $total,
                    'note' => $validated['note'] ?? null,
                ]);

                /* =====================
                CREATE NEW ITEMS + FIFO
                ===================== */
                foreach ($validated['items'] as $data) {

                    $item = $sale->items()->create([
                        'product_id' => $data['product_id'],
                        'product_variant_id' => $data['product_variant_id'] ?? null,
                        'qty' => $data['qty'],
                        'price' => $data['price'],
                        'discount' => $data['discount'] ?? 0,
                        'subtotal' => ($data['qty'] * $data['price'])
                                    - ($data['discount'] ?? 0),
                    ]);

                    $fifo->deduct(
                        $item,
                        $data['product_id'],
                        $data['product_variant_id'] ?? null,
                        $data['qty']
                    );
                }
            });

            return redirect()->route('sales.index')
                ->with('success', 'Sale updated successfully.');

        } catch (\Throwable $e) {
            report($e);
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }


        

    public function destroy(Sale $sale)
    {
        return back()->withErrors([
            'error' => 'Sales deletion is not allowed (FIFO integrity).',
        ]);
    }

    private function validateSale(Request $request): array
    {
        return $request->validate([
            'sale_date' => ['required', 'date'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'exists:product_variants,id'],
            'items.*.qty' => ['required', 'numeric', 'gt:0'],
            'items.*.price' => ['required', 'numeric', 'gt:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0'],
        ]);
    }
    
    public function productOptions()
    {
        return Product::with(['variants' => function ($q) {
                $q->where('is_active', true);
            }])
            ->where('is_active', true)
            ->get()
            ->flatMap(function ($product) {

                // PRODUCT WITHOUT VARIANTS
                if (!$product->has_variant) {
                    return [[
                        'id' => 'p-' . $product->id,
                        'label' => $product->name,
                        'product_id' => $product->id,
                        'variant_id' => null,
                        'price' => $product->selling_price, // ✅
                    ]];
                }

                // PRODUCT WITH VARIANTS
                return $product->variants->map(function ($variant) use ($product) {
                    return [
                        'id' => 'v-' . $variant->id,
                        'label' => $product->name . ' — ' . $variant->name,
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'price' => $variant->selling_price, // ✅
                    ];
                });
            })
            ->values();
    }


    function sellingPrice($item): float
    {
        if ($item instanceof \App\Models\ProductVariant) {
            return $item->selling_price;
        }

        return $item->selling_price;
    }


}
