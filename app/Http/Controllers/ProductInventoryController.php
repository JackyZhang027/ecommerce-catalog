<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductsAndVariants;
use Illuminate\Http\Request;

class ProductInventoryController extends Controller
{
    public function index(Request $request)
    {
        
        $query = ProductsAndVariants::query();

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhere('category_name', 'like', "%{$search}%")
                ->orWhereRaw("
                        product_id IN (
                            SELECT id FROM products WHERE name LIKE ?
                        )
                    ", ["%{$search}%"]);
            });
        }

        $items = $query->orderBy('type')->paginate(30)
            ->appends(['search' => $search]);

        return inertia('inventory/Index', [
            'items' => $items,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }


    // Update stock or price
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'type'  => 'required|in:product,variant',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|numeric|min:0',
        ]);

        if ($validated['type'] === 'product') {
            // update product stock & price
            Product::findOrFail($id)->update([
                'price' => $validated['price'],
                'stock' => $validated['stock'],
            ]);
        } else {
            // update variant stock & price
            ProductVariant::findOrFail($id)->update([
                'price' => $validated['price'],
                'stock' => $validated['stock'],
            ]);
        }

        return back()->with('success', 'Updated successfully!');
    }
}
