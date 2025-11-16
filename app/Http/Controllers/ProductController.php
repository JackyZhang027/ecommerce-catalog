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
        // normalize boolean
        $request->merge(['has_variant' => filter_var($request->input('has_variant'), FILTER_VALIDATE_BOOLEAN)]);
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

                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $img) {
                        $p->addMedia($img)->usingFileName(uniqid().'.'.$img->getClientOriginalExtension())->toMediaCollection('images');
                    }
                }

                if ($validated['has_variant']) {
                    $this->saveVariants($p, $validated['variants']);
                }

                return $p;
            });

            return redirect()->route('products.edit', ['product' => $product->id])->with('success','Product created');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return back()->withErrors(['__global' => $e->getMessage()])->withInput();
        }
    }


    
    public function update(Request $request, Product $product)
    {
        $request->merge(['has_variant' => filter_var($request->input('has_variant'), FILTER_VALIDATE_BOOLEAN)]);
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

                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $img) {
                        $product->addMedia($img)->usingFileName(uniqid().'.'.$img->getClientOriginalExtension())->toMediaCollection('images');
                    }
                }

                // simple refresh strategy: delete existing variants then create new ones
                if ($validated['has_variant']) {
                    $this->saveVariants($product, $validated['variants']);
                }
            });

            return back()->with('success','Product updated');
        } catch (\Illuminate\Validation\ValidationException $e) {
            dd($e);
            throw $e;
        } catch (\Exception $e) {
            dd($e);
            return back()->withErrors(['__global'=>$e->getMessage()])->withInput();
        }
    }


    public function saveVariants(Product $product, $variants)
    {
        $existingIds = $product->variants()->pluck('id')->toArray();
        $incomingIds = collect($variants)->pluck('id')->filter()->toArray();

        // Delete removed variants
        $toDelete = array_diff($existingIds, $incomingIds);
        if (!empty($toDelete)) {
            ProductVariant::whereIn('id', $toDelete)->delete();
        }

        foreach ($variants as $data) {
            // UPDATE
            if (!empty($data['id'])) {
                $variant = ProductVariant::find($data['id']);
                $variant->update([
                    'name' => $data['name'],
                    'sku' => $data['sku'],
                    'price' => $data['price'],
                    'stock' => $data['stock'],
                    'is_active' => $data['is_active'] ?? true,
                ]);

            } 
            // CREATE
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
            $this->saveVariantImages($variant, $data['images'] ?? [], $data['existingImages'] ?? []);
        }
    }

    protected function saveVariantAttributes(ProductVariant $variant, $values)
    {
        // Remove missing ones
        $existing = $variant->variantValues()->pluck('id')->toArray();
        $incoming = collect($values)->pluck('id')->filter()->toArray();
        $toDelete = array_diff($existing, $incoming);
        if ($toDelete) {
            ProductVariantValue::whereIn('id', $toDelete)->delete();
        }

        foreach ($values as $val) {

            // update existing
            if (!empty($val['id'])) {
                ProductVariantValue::where('id', $val['id'])->update([
                    'attribute_id' => $val['attribute_id'],
                    'attribute_value_id' => $val['attribute_value_id'],
                ]);
            } else {
                // create new
                $variant->variantValues()->create([
                    'attribute_id' => $val['attribute_id'],
                    'attribute_value_id' => $val['attribute_value_id'],
                ]);
            }
        }
    }

    protected function saveVariantImages(ProductVariant $variant, $newImages = [], $existingImages = [])
    {
        // Add ALL new uploaded images
        if (!empty($newImages)) {
            foreach ($newImages as $file) {
                if ($file instanceof \Illuminate\Http\UploadedFile) {
                    $variant->addMedia($file)
                        ->toMediaCollection('variant_images');
                }
            }
        }
    }


    private function validateProduct(Request $request, $productId = null)
    {
        return $request->validate([
            'name' => ['required', 'string', Rule::unique('products', 'name')->ignore($productId)],
            'category_id' => ['required', 'integer', Rule::exists('product_categories', 'id')],
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric'],
            'has_variant' => ['required', 'boolean'],

            'images.*' => ['nullable', 'file', 'image'],

            'variants' => ['required_if:has_variant,true','array','min:1'],
            'variants.*.id' => ['nullable', 'integer', Rule::exists('product_variants', 'id')],
            'variants.*.name' => ['required_if:has_variant,true','string'],
            'variants.*.sku' => ['required_if:has_variant,true','string','max:255'],
            'variants.*.price' => ['required_if:has_variant,true','numeric'],
            'variants.*.stock' => ['required_if:has_variant,true','integer'],
            'variants.*.images.*' => ['nullable','file','image'],
            'variants.*.values' => ['nullable','array'],
            'variants.*.values.*.attribute_id' => ['required_with:variants.*.values','integer', Rule::exists('attributes','id')],
            'variants.*.values.*.attribute_value_id' => ['required_with:variants.*.values','integer', Rule::exists('attribute_values','id')],
        ]);
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

    public function deleteVariantMedia(Product $product, $variantId, $mediaId)
    {
        $variant = ProductVariant::find($variantId);
        if (!$variant || $variant->product_id !== $product->id) return back()->withErrors(['variant'=>'Not found']);
        $media = $variant->media()->where('id', $mediaId)->first();
        if (!$media) return back()->withErrors(['image'=>'Not found']);
        $media->delete();
        return back()->with('success','Variant image deleted');
    }


}
