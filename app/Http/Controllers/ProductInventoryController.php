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
        $search = $request->search;
        $category = $request->category;

        $query = ProductsAndVariants::query();

        // Filter: search
        if ($search) {
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

        // Filter: category
        if ($category) {
            $query->where('category_id', $category);
        }

        $items = $query
            ->orderBy('type')
            ->paginate(30)
            ->appends(request()->only('search', 'category'));

        return inertia('inventory/Index', [
            'items'      => $items,       // MUST be paginator
            'filters'    => request()->only('search', 'category'),
            'categories' => \App\Models\ProductCategory::select('id', 'name')->get(),
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
