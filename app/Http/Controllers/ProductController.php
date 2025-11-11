<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Spatie\Permission\Models\Permission;
use App\Models\ProductCategory;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($sort = $request->input('sort')) {
            $direction = $request->input('direction', 'asc');
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('id', 'desc');
        }

        $products = $query->paginate($request->input('per_page', 10))->withQueryString();

        return inertia('products/Index', [
            'products' => [
                'data' => $products->items(),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'from' => $products->firstItem(),
                    'to' => $products->lastItem(),
                    'total' => $products->total(),
                    'last_page' => $products->lastPage(),
                    'links' => $products->linkCollection(),
                ],
            ],
            'filters' => $request->only(['search', 'sort', 'direction', 'per_page']),
        ]);
    }

    public function create()
    {
        $categories = ProductCategory::where('is_active', true)->get();
        return Inertia::render('products/Form', ['categories' => $categories]);
    }

    public function edit(Product $product)
    {
        $product->load('media');
        $categories = ProductCategory::where('is_active', true)->get();
        return Inertia::render('products/Form', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'stock' => 'required|numeric',
            'category_id' => 'required|exists:product_categories,id',
            'images.*' => 'nullable|image|max:2048',
        ]);

        $product = Product::create($validated);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $product->addMedia($image)->toMediaCollection('images');
            }
        }

        return redirect()->route('products.edit', $product->id)->with('success', 'Product created successfully');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'stock' => 'required|numeric',
            'category_id' => 'required|exists:product_categories,id',
            'images.*' => 'nullable|image|max:2048',
        ]);

        $product->update($validated);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $product->addMedia($image)->toMediaCollection('images');
            }
        }
        return back()->with('success', 'Product updated successfully.');

    }


    public function destroy(Product $product)
    {
        $product->delete();

        return back()->with('success', 'Product deleted successfully');
    }

    public function toggleActive(Product $product)
    {
        $product->is_active = !$product->is_active;
        $product->save();

        return back()->with('success', 'Status updated.');
    }
    public function deleteMedia(Product $product, $mediaId)
    {
        $media = $product->media()->where('id', $mediaId)->firstOrFail();
        $media->delete();

        return back()->with('success', 'Image deleted successfully.');
    }

}
