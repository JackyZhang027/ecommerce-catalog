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
        $attributes = Attribute::with('values:id,attribute_id,value')->where('is_active', true)->get(['id', 'name']);

        return Inertia::render('products/Form', 
            [
                'categories' => $categories,
                'attributes' => $attributes
            ]
        );
    }

    public function edit(Product $product)
    {
        $product->load('media');
        $categories = ProductCategory::where('is_active', true)->get();
        $attributes = Attribute::with('values:id,attribute_id,value')->where('is_active', true)->get(['id', 'name']);
        $images = $product->getMedia('images')->map(fn($m)=> ['id'=>$m->id, 'url'=>$m->getUrl()])->toArray();
        $variants = $product->variants()
            ->with([
                'media',
                'variantValues.attribute',
                'variantValues.attributeValue'
            ])
            ->get()
            ->map(function($variant) {
                return [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'sku' => $variant->sku,
                    'price' => $variant->price,
                    'stock' => $variant->stock,
                    'is_active' => $variant->is_active,
                    'images' => $variant->getMedia('variant_images')->map(fn($m)=> [
                        'id'=>$m->id,
                        'url'=>$m->getUrl()
                    ])->toArray(),
                    'values' => $variant->variantValues->map(function($vv) {
                        return [
                            'id' => $vv->id,
                            'attribute_id' => $vv->attribute_id,
                            'attribute_name' => $vv->attribute->name ?? null,
                            'attribute_value_id' => $vv->attribute_value_id,
                            'attribute_value' => $vv->attributeValue->value ?? null,
                        ];
                    })->toArray(),
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
            'categories' => $categories,
            'attributes' => $attributes,
        ]);

    }

    public function store(Request $request)
    {
        // Normalize boolean
        $request->merge([
            'has_variant' => filter_var($request->input('has_variant'), FILTER_VALIDATE_BOOLEAN)
        ]);
        
        $validated = $this->validateProduct($request);
        
        try {
            $product = DB::transaction(function() use ($request, $validated) {
                $p = Product::create([
                    'name' => $validated['name'],
                    'category_id' => $validated['category_id'],
                    'description' => $validated['description'] ?? null,
                    'price' => $validated['price'] ?? 0,
                    'stock' => $validated['stock'] ?? 0,
                    'has_variant' => $validated['has_variant'],
                ]);
                
                // Handle product images
                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $img) {
                        $p->addMedia($img)
                            ->usingFileName(uniqid() . '.' . $img->getClientOriginalExtension())
                            ->toMediaCollection('images');
                    }
                }
                
                // Handle variants
                if ($validated['has_variant'] && !empty($validated['variants'])) {
                    $this->saveVariants($p, $validated['variants']);
                }
                
                return $p;
            });
            
            return redirect()
                ->route('products.edit', ['product' => $product->id])
                ->with('success', 'Product created successfully');
                
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Product creation failed: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->except(['images', 'variants.*.images'])
            ]);
            return back()
                ->withErrors(['error' => 'Failed to create product: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function update(Request $request, Product $product)
    {
        // Normalize boolean
        $request->merge([
            'has_variant' => filter_var($request->input('has_variant'), FILTER_VALIDATE_BOOLEAN)
        ]);
        
        $validated = $this->validateProduct($request, $product->id);
        
        try {    
            DB::transaction(function() use ($request, $validated, $product) {
                $product->update([
                    'name' => $validated['name'],
                    'category_id' => $validated['category_id'],
                    'description' => $validated['description'] ?? null,
                    'price' => $validated['price'] ?? 0,
                    'stock' => $validated['stock'] ?? 0,
                    'has_variant' => $validated['has_variant'],
                ]);
                
                // Handle new product images
                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $img) {
                        $product->addMedia($img)
                            ->usingFileName(uniqid() . '.' . $img->getClientOriginalExtension())
                            ->toMediaCollection('images');
                    }
                }
                
                // Handle variants
                if ($validated['has_variant'] && !empty($validated['variants'])) {
                    $this->saveVariants($product, $validated['variants']);
                } else {
                    // If has_variant is disabled, delete all variants
                    $product->variants()->delete();
                }
            });
            
            return back()->with('success', 'Product updated successfully');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Product update failed: ' . $e->getMessage(), [
                'exception' => $e,
                'product_id' => $product->id,
                'request' => $request->except(['images', 'variants.*.images'])
            ]);
            return back()
                ->withErrors(['error' => 'Failed to update product: ' . $e->getMessage()])
                ->withInput();
        }
    }


    protected function saveVariants(Product $product, $variants)
    {
        $existingIds = $product->variants()->pluck('id')->toArray();
        $incomingIds = collect($variants)->pluck('id')->filter()->toArray();
        
        // Delete removed variants
        $toDelete = array_diff($existingIds, $incomingIds);
        if (!empty($toDelete)) {
            ProductVariant::whereIn('id', $toDelete)->delete();
        }
        
        foreach ($variants as $data) {
            // UPDATE existing variant
            if (!empty($data['id'])) {
                $variant = ProductVariant::find($data['id']);
                
                if (!$variant || $variant->product_id !== $product->id) {
                    continue; // Skip if variant doesn't belong to this product
                }
                
                $variant->update([
                    'name' => $data['name'],
                    'sku' => $data['sku'],
                    'price' => $data['price'],
                    'stock' => $data['stock'],
                    'is_active' => $data['is_active'] ?? true,
                ]);
            } 
            // CREATE new variant
            else {
                $variant = $product->variants()->create([
                    'name' => $data['name'],
                    'sku' => $data['sku'],
                    'price' => $data['price'],
                    'stock' => $data['stock'],
                    'is_active' => $data['is_active'] ?? true,
                ]);
            }
            
            // Sync attribute values
            $this->saveVariantAttributes($variant, $data['values'] ?? []);
            
            // Sync images
            $this->saveVariantImages(
                $variant, 
                $data['images'] ?? [], 
                $data['existingImages'] ?? []
            );
        }
    }

    protected function saveVariantAttributes(ProductVariant $variant, $values)
    {
        // Get existing variant values
        $existing = $variant->variantValues()->pluck('id')->toArray();
        $incoming = collect($values)->pluck('id')->filter()->map(fn($id) => (int)$id)->toArray();
        
        // Delete removed attribute values
        $toDelete = array_diff($existing, $incoming);
        if (!empty($toDelete)) {
            ProductVariantValue::whereIn('id', $toDelete)->delete();
        }
        
        foreach ($values as $val) {
            // Validate required fields
            if (empty($val['attribute_id']) || empty($val['attribute_value_id'])) {
                continue;
            }
            
            // Update existing variant value
            if (!empty($val['id'])) {
                $variantValue = ProductVariantValue::find($val['id']);
                
                if ($variantValue && $variantValue->product_variant_id === $variant->id) {
                    $variantValue->update([
                        'attribute_id' => $val['attribute_id'],
                        'attribute_value_id' => $val['attribute_value_id'],
                    ]);
                }
            } 
            // Create new variant value
            else {
                // Check for duplicate combination for this variant
                $exists = ProductVariantValue::where('product_variant_id', $variant->id)
                    ->where('attribute_id', $val['attribute_id'])
                    ->where('attribute_value_id', $val['attribute_value_id'])
                    ->exists();
                
                if (!$exists) {
                    $variant->variantValues()->create([
                        'attribute_id' => $val['attribute_id'],
                        'attribute_value_id' => $val['attribute_value_id'],
                    ]);
                }
            }
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
        
        $rules = [
            'name' => [
                'required', 
                'string', 
                'max:255',
                Rule::unique('products', 'name')->ignore($productId)
            ],
            'category_id' => [
                'required', 
                'integer', 
                Rule::exists('product_categories', 'id')
            ],
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'numeric', 'min:0'],
            'has_variant' => ['required', 'boolean'],
            'images.*' => ['nullable', 'file', 'image', 'max:5120'], // 5MB max
        ];
        
        // Variant validation rules
        if ($request->input('has_variant')) {
            $rules = array_merge($rules, [
                'variants' => ['required', 'array', 'min:1'],
                'variants.*.id' => [
                    'nullable', 
                    'integer', 
                    Rule::exists('product_variants', 'id')->where('product_id', $productId)
                ],
                'variants.*.name' => ['required', 'string', 'max:255'],
                'variants.*.sku' => [
                    'required', 
                    'string', 
                    'max:255',
                    // Custom rule for unique SKU within the request
                    function ($attribute, $value, $fail) use ($request, $productId) {
                        // Get the current variant index
                        preg_match('/variants\.(\d+)\.sku/', $attribute, $matches);
                        $currentIndex = $matches[1] ?? null;
                        
                        // Check uniqueness within request variants
                        $variants = $request->input('variants', []);
                        $skuCount = 0;
                        foreach ($variants as $index => $variant) {
                            if (isset($variant['sku']) && 
                                strtolower(trim($variant['sku'])) === strtolower(trim($value))) {
                                $skuCount++;
                            }
                        }
                        
                        if ($skuCount > 1) {
                            $fail('The SKU must be unique across all variants.');
                            return;
                        }
                        
                        // Check uniqueness in database (exclude current product's variants if editing)
                        $query = ProductVariant::where('sku', $value);
                        
                        if ($productId) {
                            // When editing, exclude variants of current product
                            $query->whereHas('product', function($q) use ($productId) {
                                $q->where('id', '!=', $productId);
                            });
                            
                            // Also exclude the current variant being edited
                            $currentVariantId = $variants[$currentIndex]['id'] ?? null;
                            if ($currentVariantId) {
                                $query->where('id', '!=', $currentVariantId);
                            }
                        }
                        
                        if ($query->exists()) {
                            $fail('The SKU has already been taken.');
                        }
                    }
                ],
                'variants.*.price' => ['required', 'numeric', 'min:0'],
                'variants.*.stock' => ['required', 'numeric', 'min:0'],
                'variants.*.images' => ['nullable', 'array'],
                'variants.*.images.*' => ['nullable', 'file', 'image', 'max:5120'], // 5MB max
                'variants.*.existingImages' => ['nullable', 'array'],
                'variants.*.existingImages.*.id' => ['nullable', 'integer'],
                'variants.*.values' => ['required', 'array', 'min:1'], // At least 1 attribute required
                'variants.*.values.*.id' => ['nullable', 'integer'],
                'variants.*.values.*.attribute_id' => [
                    'required', 
                    'integer', 
                    Rule::exists('attributes', 'id')
                ],
                'variants.*.values.*.attribute_value_id' => [
                    'required', 
                    'integer', 
                    Rule::exists('attribute_values', 'id')
                ],
            ]);
        }
        
        return $request->validate($rules, [
            'variants.*.sku.required' => 'SKU is required for all variants.',
            'variants.*.values.required' => 'Each variant must have at least one attribute.',
            'variants.*.values.min' => 'Each variant must have at least one attribute.',
        ]);
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
