<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\StockBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::with('supplier');

        if ($search = $request->input('search')) {
            $query->where('reference', 'like', "%{$search}%");
        }

        $allowedSorts = ['id', 'reference', 'purchase_date', 'total', 'created_at'];

        if ($sort = $request->input('sort')) {
            if (in_array($sort, $allowedSorts)) {
                $query->orderBy($sort, $request->input('direction', 'asc'));
            }
        } else {
            $query->orderBy('id', 'desc');
        }

        $purchases = $query
            ->paginate($request->input('per_page', 10))
            ->withQueryString();

        return inertia('purchases/Index', [
            'purchases' => [
                'data' => $purchases->items(),
                'meta' => [
                    'current_page' => $purchases->currentPage(),
                    'from' => $purchases->firstItem(),
                    'to' => $purchases->lastItem(),
                    'total' => $purchases->total(),
                    'last_page' => $purchases->lastPage(),
                    'links' => $purchases->linkCollection(),
                ],
            ],
            'filters' => $request->only(['search', 'sort', 'direction', 'per_page']),
        ]);
    }

    public function create()
    {
        $suppliers = Supplier::active()->get(['id', 'name']);

        $products = $this->productOptions();

        return inertia('purchases/Form', [
            'suppliers' => $suppliers,
            'products' => $products,
        ]);
    }


    public function store(Request $request)
    {
        $rules = [
            'purchase_date' => ['required', 'date'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'note' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'exists:product_variants,id'],
            'items.*.qty' => ['required', 'numeric', 'gt:0'],
            'items.*.cost' => ['required', 'numeric', 'gt:0'],
        ];

        $messages = [
            'purchase_date.required' => 'Purchase date is required.',
            'purchase_date.date' => 'Purchase date must be a valid date.',

            'items.required' => 'Please add at least one product.',
            'items.min' => 'Please add at least one product.',

            'items.*.product_id.required' => 'Please select a product for item :position.',
            'items.*.product_id.exists' => 'Selected product for item :position is invalid.',

            'items.*.product_variant_id.exists' => 'Selected variant for item :position is invalid.',

            'items.*.qty.required' => 'Quantity is required for item :position.',
            'items.*.qty.min' => 'Quantity must be greater than zero for item :position.',

            'items.*.cost.required' => 'Cost is required for item :position.',
            'items.*.cost.min' => 'Cost must be greater than zero for item :position.',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        // Replace :position with row number
        $validator->after(function ($validator) {
            foreach ($validator->errors()->getMessages() as $key => $msgs) {
                if (preg_match('/items\.(\d+)\./', $key, $m)) {
                    $row = $m[1] + 1;
                    $validator->errors()->forget($key);
                    foreach ($msgs as $msg) {
                        $validator->errors()->add($key, str_replace(':position', "#{$row}", $msg));
                    }
                }
            }
        });

        $validated = $validator->validate();

        DB::transaction(function () use ($validated) {
            $purchase = Purchase::create([
                'reference' => 'PUR-' . now()->format('YmdHis'),
                'purchase_date' => $validated['purchase_date'],
                'supplier_id' => $validated['supplier_id'] ?? null,
                'note' => $validated['note'] ?? null,
            ]);

            $total = 0;

            foreach ($validated['items'] as $item) {
                $subtotal = bcmul($item['qty'], $item['cost'], 2);

                $purchaseItem = $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'qty' => $item['qty'],
                    'cost' => $item['cost'],
                    'subtotal' => $subtotal,
                ]);

                StockBatch::create([
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'purchase_item_id' => $purchaseItem->id,
                    'qty_in' => $item['qty'],
                    'cost' => $item['cost'],
                    'received_at' => $purchase->purchase_date,
                ]);

                $total += $subtotal;
            }

            $purchase->update(['total' => $total]);
        });

        return redirect()
            ->route('purchases.index')
            ->with('success', 'Purchase created successfully.');
    }

    public function edit(Purchase $purchase)
    {
        $purchase->load('items.product', 'items.variant');

        $hasSales = StockBatch::whereIn(
                'purchase_item_id',
                $purchase->items->pluck('id')->toArray()
            )
            ->where('qty_out', '>', 0)
            ->exists();

        return inertia('purchases/Form', [
            'purchase'  => $purchase,
            'hasSales'  => $hasSales,
            'suppliers' => Supplier::active()->get(),
            'products'  => $this->productOptions(),
        ]);
    }


    public function update(Request $request, Purchase $purchase)
    {
        $hasSales = StockBatch::whereIn(
                'purchase_item_id',
                $purchase->items->pluck('id')->toArray()
            )
            ->where('qty_out', '>', 0)
            ->exists();

        if ($hasSales) {
            return back()->withErrors([
                'error' => 'This purchase cannot be edited because stock has already been used.',
            ]);
        }

        $validated = $request->validate([
            'purchase_date' => ['required', 'date'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'reference' => ['required', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'exists:product_variants,id'],
            'items.*.qty' => ['required', 'numeric', 'gt:0'],
            'items.*.cost' => ['required', 'numeric', 'gt:0'],
        ]);

        DB::transaction(function () use ($purchase, $validated) {

            // rollback old batches
            StockBatch::whereIn(
                'purchase_item_id',
                $purchase->items->pluck('id')->toArray()
            )->delete();

            $purchase->items()->delete();

            $total = 0;

            foreach ($validated['items'] as $item) {
                $subtotal = bcmul($item['qty'], $item['cost'], 2);

                $purchaseItem = $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'],
                    'qty' => $item['qty'],
                    'cost' => $item['cost'],
                    'subtotal' => $subtotal,
                ]);

                StockBatch::create([
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'],
                    'purchase_item_id' => $purchaseItem->id,
                    'qty_in' => $item['qty'],
                    'cost' => $item['cost'],
                    'received_at' => $validated['purchase_date'],
                ]);

                $total += $subtotal;
            }

            $purchase->update([
                'purchase_date' => $validated['purchase_date'],
                'supplier_id' => $validated['supplier_id'],
                'reference' => $validated['reference'],
                'total' => $total,
            ]);
        });

        return redirect()
            ->route('purchases.index')
            ->with('success', 'Purchase updated.');
    }

    public function destroy(Purchase $purchase)
    {
        $hasSales = StockBatch::whereIn(
                'purchase_item_id',
                $purchase->items->pluck('id')->toArray()
            )
            ->where('qty_out', '>', 0)
            ->exists();

        if ($hasSales) {
            return back()->withErrors([
                'error' => 'This purchase cannot be deleted because stock has already been used.',
            ]);
        }

        DB::transaction(function () use ($purchase) {
            StockBatch::whereIn(
                'purchase_item_id',
                $purchase->items->pluck('id')->toArray()
            )->delete();

            $purchase->items()->delete();

            $purchase->delete();
        });

        return back()->with('success', 'Purchase deleted.');
    }

    public function productOptions()
    {
        return Product::with('variants')
            ->where('is_active', true)
            ->get()
            ->flatMap(function ($product) {

                // Product WITHOUT variants
                if ($product->variants->isEmpty()) {
                    return [[
                        'id' => 'p-' . $product->id,
                        'label' => $product->name, // ✅ REQUIRED
                        'product_id' => $product->id,
                        'variant_id' => null,
                    ]];
                }

                // Product WITH variants
                return $product->variants
                    ->where('is_active', true)
                    ->map(function ($variant) use ($product) {
                        return [
                            'id' => 'v-' . $variant->id,
                            'label' => $product->name . ' — ' . $variant->name, // ✅ REQUIRED
                            'product_id' => $product->id,
                            'variant_id' => $variant->id,
                        ];
                    });
            })
            ->values();
    }
}
