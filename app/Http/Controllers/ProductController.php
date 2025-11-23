<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Spatie\Permission\Models\Permission;
use App\Models\ProductCategory;
use App\Models\Attribute;
use App\Models\ProductVariant;
use App\Models\ProductVariantValue;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;


class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'media']); // FIX: Eager load to prevent N+1 queries

        if ($search = $request->input('search')) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%"); // FIX: Usually users want to search description too
            });
        }

        $sort = $request->input('sort', 'id');
        $direction = $request->input('direction', 'desc');

        // Security: Ensure sort column actually exists to prevent SQL injection attempts
        if (in_array($sort, ['id', 'name', 'price', 'stock', 'created_at'])) {
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
        return Inertia::render('products/Form', [
            'categories' => ProductCategory::where('is_active', true)->get(),
            'attributes' => Attribute::with('values:id,attribute_id,value')->where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function edit(Product $product)
    {
        $product->load(['media', 'variants.media', 'variants.variantValues.attribute', 'variants.variantValues.attributeValue']);
        $images = $product->getMedia('images')->map(fn($m)=> ['id'=>$m->id, 'url'=>$m->getUrl()])->toArray();
        
        $variants = $product->variants->map(function($variant) {
            return [
                'id' => $variant->id,
                'name' => $variant->name,
                'sku' => $variant->sku,
                'price' => $variant->price,
                'stock' => $variant->stock,
                'is_active' => (bool)$variant->is_active,
                'images' => $variant->getMedia('variant_images')->map(fn($m)=> ['id'=>$m->id, 'url'=>$m->getUrl()])->toArray(),
                'values' => $variant->variantValues->map(function($vv) {
                    return [
                        'id' => $vv->id,
                        'attribute_id' => $vv->attribute_id,
                        'attribute_name' => $vv->attribute->name ?? null,
                        'attribute_value_id' => $vv->attribute_value_id,
                        'attribute_value' => $vv->attributeValue->value ?? null,
                    ];
                })->toArray(),
                'existingImages' => $variant->getMedia('variant_images')->map(fn($m)=> ['id'=>$m->id, 'url'=>$m->getUrl()])->toArray(), // Helper for frontend
            ];
        });

        return inertia('products/Form', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'stock' => $product->stock,
                'category_id' => $product->category_id,
                'has_variant' => (bool)$product->has_variant,
                'images' => $images,
                'variants' => $variants,
            ],
            'categories' => ProductCategory::where('is_active', true)->get(),
            'attributes' => Attribute::with('values:id,attribute_id,value')->where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $request->merge(['has_variant' => filter_var($request->input('has_variant'), FILTER_VALIDATE_BOOLEAN)]);
        
        // Validation now returns validated data
        $validated = $this->validateProduct($request); 

        try {
            $product = DB::transaction(function() use ($request, $validated) {
                $p = Product::create($validated); // We can pass $validated directly if keys match fillable

                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $img) {
                        $p->addMedia($img)->toMediaCollection('images');
                    }
                }

                if ($validated['has_variant'] && !empty($request->input('variants'))) {
                    // Pass the raw request variants array to handle file uploads correctly
                    $this->saveVariants($p, $request->input('variants'), $request);
                }

                return $p;
            });

            return redirect()->route('products.edit', $product->id)->with('success', 'Product created successfully');
        } catch (\Exception $e) {
            \Log::error('Product creation failed', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'System error: ' . $e->getMessage()])->withInput();
        }
    }

    public function update(Request $request, Product $product)
    {
        // dd();
        $request->merge(['has_variant' => filter_var($request->input('has_variant'), FILTER_VALIDATE_BOOLEAN)]);
        
        $validated = $this->validateProduct($request, $product->id);
        try {
            DB::transaction(function() use ($request, $validated, $product) {
                $product->update($validated);
                

                if ($request->hasFile('images')) {
                    
                    foreach ($request->file('images') as $img) {
                        $product->addMedia($img)->toMediaCollection('images');
                    }
                }
                if ($validated['has_variant']) {
                    $this->saveVariants($product, $request->input('variants'), $request);
                } else {
                    $product->variants()->delete(); // Soft delete if model uses SoftDeletes, otherwise hard delete
                }
            });

            return back()->with('success', 'Product updated successfully');
        } catch (\Exception $e) {
            \Log::error('Product update failed', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'System error: ' . $e->getMessage()])->withInput();
        }
    }

    protected function saveVariants(Product $product, array $variantsData, Request $request)
    {
        // 1. Get IDs of variants currently in DB
        $existingIds = $product->variants()->pluck('id')->toArray();
        
        // 2. Get IDs present in the request
        $incomingIds = collect($variantsData)->pluck('id')->filter()->toArray();

        // 3. Delete variants that are in DB but NOT in Request
        $product->variants()->whereIn('id', array_diff($existingIds, $incomingIds))->delete();

        // 4. Loop through request data
        foreach ($variantsData as $index => $data) {
            $variant = $product->variants()->updateOrCreate(
                ['id' => $data['id'] ?? null],
                [
                    'name' => $data['name'],
                    'sku' => $data['sku'],
                    'price' => $data['price'],
                    'stock' => $data['stock'],
                    'is_active' => $data['is_active'] ?? true,
                ]
            );

            // CHANGED: Pass 'attributes' instead of 'values'
            $this->saveVariantAttributes($variant, $data['attributes'] ?? []);

            // Handle Images
            if ($request->hasFile("variants.{$index}.images")) {
                foreach ($request->file("variants.{$index}.images") as $file) {
                    $variant->addMedia($file)->toMediaCollection('variant_images');
                }
            }
        }
    }

    protected function saveVariantAttributes(ProductVariant $variant, array $attributes)
    {
        // $attributes comes in as: [ "1" => "5", "2" => "10" ] 
        // (Key is Attribute ID, Value is Attribute Value ID)

        // 1. Identify incoming Attribute IDs (the keys)
        $incomingAttributeIds = array_keys($attributes);

        // 2. Delete existing pivot records for Attribute IDs NOT in the request
        // (e.g. User removed "Color" from this variant but kept "Size")
        $variant->variantValues()
            ->whereNotIn('attribute_id', $incomingAttributeIds)
            ->delete();

        // 3. Update or Create records
        foreach ($attributes as $attributeId => $attributeValueId) {
            if (empty($attributeId) || empty($attributeValueId)) continue;

            // We use updateOrCreate based on (variant_id + attribute_id)
            // because a variant can only have ONE value per attribute type.
            $variant->variantValues()->updateOrCreate(
                [
                    'product_variant_id' => $variant->id,
                    'attribute_id' => (int) $attributeId
                ],
                [
                    'attribute_value_id' => (int) $attributeValueId
                ]
            );
        }
    }
    
    protected function saveVariantImages(ProductVariant $variant, $newImages = [], $existingImages = [])
    {
        // Handle deletion of removed images
        if (!empty($existingImages)) {
            $existingIds = collect($existingImages)->pluck('id')->filter()->toArray();
            $currentIds = $variant->getMedia('variant_images')->pluck('id')->toArray();
            $toDelete = array_diff($currentIds, $existingIds);
            
            if (!empty($toDelete)) {
                foreach ($toDelete as $mediaId) {
                    $media = $variant->media()->find($mediaId);
                    if ($media) {
                        $media->delete();
                    }
                }
            }
        }
        
        // Add new uploaded images
        if (!empty($newImages)) {
            foreach ($newImages as $file) {
                if ($file instanceof \Illuminate\Http\UploadedFile) {
                    $variant->addMedia($file)
                        ->usingFileName(uniqid() . '.' . $file->getClientOriginalExtension())
                        ->toMediaCollection('variant_images');
                }
            }
        }
    }

    private function validateProduct(Request $request, $productId = null)
    {
        $mediaRules = [
            'nullable', 
            'file', 
            'mimes:jpeg,png,jpg,webp,mp4,mov,avi,webm', // Allowed types
            'max:51200' // 50MB
        ];
        
        $rules = [
            'name' => ['required', 'string', 'max:255', Rule::unique('products')->ignore($productId)],
            'category_id' => ['required', 'exists:product_categories,id'],
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'numeric', 'min:0'],
            'has_variant' => ['required', 'boolean'],
            'images.*' => $mediaRules,
        ];

        if ($request->input('has_variant')) {
            $rules = array_merge($rules, [
                'variants' => ['required', 'array', 'min:1'],
                'variants.*.name' => ['required', 'string', 'max:255'],
                'variants.*.price' => ['required', 'numeric', 'min:0'],
                'variants.*.stock' => ['required', 'numeric', 'min:0'],
                'variants.*.attributes' => ['required', 'array', 'min:1'],
                'variants.*.attributes.*' => ['required', 'integer', 'exists:attribute_values,id'],

                'variants.*.sku' => [
                    'required', 'string', 'max:255', 'distinct',
                    function ($attribute, $value, $fail) use ($productId) {
                        $query = ProductVariant::where('sku', $value);
                        if ($productId) {
                            $query->where('product_id', '!=', $productId);
                        }
                        if ($query->exists()) {
                            $fail("The SKU '{$value}' is already taken.");
                        }
                    }
                ],
                'variants.*.images' => ['nullable', 'array'],
                'variants.*.images.*' => $mediaRules,
            ]);
        }

        $attributes = [
            'category_id' => 'category',
            'variants.*.name' => 'variant name',
            'variants.*.sku' => 'variant SKU',
            'variants.*.price' => 'variant price',
            'variants.*.stock' => 'variant stock',
            'variants.*.attributes' => 'attributes',
            'images.*' => 'image'
        ];

        $messages = [
            'variants.*.sku.distinct' => 'Duplicate SKU found in list.',
            'variants.*.attributes.required' => 'Every variant must have at least one attribute.',
            'variants.*.attributes.min' => 'Every variant must have at least one attribute.',
            'images.*.max' => 'The image or video must not be greater than 50 megabytes'
        ];

        return $request->validate($rules, $messages, $attributes);
    }
    public function destroy(Product $product)
    {
        try {
            DB::transaction(function() use ($product) {
                // Delete all variants and their relationships
                $product->variants()->delete();
                
                // Delete product
                $product->delete();
            });
            
            return back()->with('success', 'Product deleted successfully');
        } catch (\Exception $e) {
            \Log::error('Product deletion failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to delete product']);
        }
    }

    public function toggleActive(Product $product)
    {
        try {
            $product->is_active = !$product->is_active;
            $product->save();
            
            $status = $product->is_active ? 'activated' : 'deactivated';
            return back()->with('success', "Product {$status} successfully");
        } catch (\Exception $e) {
            \Log::error('Toggle active failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to update status']);
        }
    }


    
    public function deleteMedia(Product $product, $mediaId)
    {
        try {
            $media = $product->media()->where('id', $mediaId)->firstOrFail();
            $media->delete();
            
            return back()->with('success', 'Image deleted successfully');
        } catch (\Exception $e) {
            \Log::error('Media deletion failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to delete image']);
        }
    }
    
    public function deleteVariantMedia(Product $product, $variantId, $mediaId)
    {
        try {
            $variant = ProductVariant::findOrFail($variantId);
            
            // Verify variant belongs to this product
            if ($variant->product_id !== $product->id) {
                return back()->withErrors(['error' => 'Variant not found']);
            }
            
            $media = $variant->media()->where('id', $mediaId)->firstOrFail();
            $media->delete();
            
            return back()->with('success', 'Variant image deleted successfully');
        } catch (\Exception $e) {
            \Log::error('Variant media deletion failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to delete variant image']);
        }
    }

}
