<?php

namespace App\Http\Controllers;

use Spatie\Permission\Models\Permission;
use App\Models\ProductCategory;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductCategory::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($sort = $request->input('sort')) {
            $direction = $request->input('direction', 'asc');
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('id', 'desc');
        }

        $categories = $query->paginate($request->input('per_page', 10))->withQueryString();

        return inertia('product_categories/Index', [
            'categories' => [
                'data' => $categories->items(),
                'meta' => [
                    'current_page' => $categories->currentPage(),
                    'from' => $categories->firstItem(),
                    'to' => $categories->lastItem(),
                    'total' => $categories->total(),
                    'last_page' => $categories->lastPage(),
                    'links' => $categories->linkCollection(),
                ],
            ],
            'filters' => $request->only(['search', 'sort', 'direction', 'per_page']),
        ]);
    }

    public function create()
    {
        $categories = ProductCategory::where('is_active', true)->get();
        return Inertia::render('product_categories/Form', ['categories' => $categories]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:255', 'unique:product_categories,name'],
            'description'      => ['nullable', 'string'],
            'parent_id'        => ['nullable', 'exists:product_categories,id'],
            'meta_title'       => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'meta_keywords'    => ['nullable', 'string'],
            'image'            => ['nullable', 'image', 'max:2048'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);

        $category = ProductCategory::create($validated);

        // ✅ Attach a single image (replaces any previous)
        if ($request->hasFile('image')) {
            $category->addMediaFromRequest('image')->toMediaCollection('category_image');
        }

        return back()->with('success', 'Product category created successfully');
    }

    public function edit(ProductCategory $category)
    {
        $categories = ProductCategory::select('id', 'name')
            ->where('id', '!=', $category->id)
            ->orderBy('name')
            ->get();

        $category->load('media');

        return Inertia::render('product_categories/Form', [
            'category'   => $category,
            'categories' => $categories,
        ]);
    }


    public function update(Request $request, ProductCategory $category)
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:255', 'unique:product_categories,name,' . $category->id],
            'description'      => ['nullable', 'string'],
            'parent_id'        => ['nullable', 'exists:product_categories,id'],
            'meta_title'       => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'meta_keywords'    => ['nullable', 'string'],
            'image'            => ['nullable', 'image', 'max:2048'],
        ]);

        $category->update($validated);

        // ✅ Replace existing image if new one uploaded
        if ($request->hasFile('image')) {
            $category->clearMediaCollection('category_image');
            $category->addMediaFromRequest('image')->toMediaCollection('category_image');
        }

        return back()->with('success', 'Product category updated successfully');
    }


    public function destroy(ProductCategory $category)
    {
        $category->delete();

        return back()->with('success', 'Category deleted successfully');
    }

    public function destroyMedia(ProductCategory $category)
    {
        $category->clearMediaCollection('category_image');
        return back()->with('success', 'Image removed successfully.');
    }


    public function toggleActive(ProductCategory $category)
    {
        $category->is_active = !$category->is_active;
        $category->save();

        return back()->with('success', 'Status updated.');
    }
}
