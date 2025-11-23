<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\SettingApp;
use App\Models\Banner;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function index()
    {
        $slides = Banner::where('is_active', true)->with('media')->orderBy('order')->get();
        return inertia('shop/Index', [
            'heroes' => $slides->map(fn($slide) => [
                'id' => $slide->id,
                'title' => $slide->title,
                'subtitle' => $slide->subtitle,
                'image' => $slide->getFirstMediaUrl('banner_image'),
                'button_text' => $slide->button_text,
                'button_link' => $slide->button_link,
            ]),
            'latest_products' => Product::latest()
                ->take(5)
                ->get()
                ->map(fn($product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'price' => (float) $product->price,
                    'discount_price' => $product->discount_price ? (float) $product->discount_price : null,
                    'image' => $product->getFirstMediaUrl('images'),
                ]),
            'categories' => ProductCategory::withCount('products')
                ->get()
                ->map(fn($category) => [
                    'id' => $category->id,
                    'slug' => $category->slug,
                    'name' => $category->name,
                    'image' => $category->getFirstMediaUrl('category_image'),
                    'product_count' => $category->products_count,
                ]),
        ]);
    }

    public function shop(Request $request)
    {
        $query = Product::query()->with(['category', 'media'])->where('is_active', true);
        // Filters
        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->category) {
            $query->where('category_id', $request->category);
        }

        if ($request->sort === 'low') {
            $query->orderBy('price', 'asc');
        } elseif ($request->sort === 'high') {
            $query->orderBy('price', 'desc');
        }

        $products = $query->paginate(15)->withQueryString();
        $categories = ProductCategory::where('is_active', true)->get();

        return Inertia::render('shop/Shop', [
            'products' => $products,
            'categories' => $categories,
            'filters' => [
                'search' => $request->get('search', ''),
                'category' => $request->get('category', ''),
                'sort' => $request->get('sort', ''),
                'page' => $request->get('page', ''),
            ],
        ]);

    }

    public function show($slug)
    {
        // Cache key unique for each product slug
        $cacheKey = "product_detail_{$slug}";

        // Cache for 24 hour
        $product = Cache::remember($cacheKey, 60*60*24, function () use ($slug) {

            $product = Product::with([
                'category',
                'media', 
                'variants.media', 
                'variants.variantValues.attribute',
                'variants.variantValues.attributeValue',
            ])->where('slug', $slug)->firstOrFail();
            
            // Media mapping helper
            $mapMedia = function ($mediaItem) {
                $type = str_starts_with($mediaItem->mime_type, 'video/') ? 'video' : 'image';
                return [
                    'url' => $mediaItem->original_url,
                    'type' => $type,
                ];
            };

            // Build variant label & map media
            $product->variants->transform(function ($variant) use ($mapMedia) {
                $labelParts = [];

                foreach ($variant->variantValues as $vv) {
                    $labelParts[] = $vv->attributeValue->value;
                }

                $variant->label = implode(' ', $labelParts);
                $variant->images = $variant->media->map($mapMedia);

                return $variant;
            });

            // Map product images
            $product->images = $product->media->map($mapMedia);

            return $product;
        });

        return Inertia::render('shop/ProductDetail', [
            'product' => $product,
        ]);
    }


    public function category($slug)
    {
        $category = ProductCategory::where('slug', $slug)->firstOrFail();

        $products = Product::where('category_id', $category->id)
            ->where('is_active', true)
            ->with('media')
            ->paginate(12);

        $shared = \App\Helpers\EcommerceHelper::sharedData();

        return Inertia::render('shop/Category', array_merge($shared, [
            'category' => $category,
            'products' => $products,
        ]));
    }


}
