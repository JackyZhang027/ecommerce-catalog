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
        $heroes = Cache::remember('shop:home:heroes', now()->addHours(6), function () {
            return Banner::where('is_active', true)
                ->with('media')
                ->orderBy('order')
                ->get()
                ->map(fn ($slide) => [
                    'id' => $slide->id,
                    'title' => $slide->title,
                    'subtitle' => $slide->subtitle,
                    'image' => $slide->getFirstMediaUrl('banner_image'),
                    'button_text' => $slide->button_text,
                    'button_link' => $slide->button_link,
                ]);
        });

        $latestProducts = Cache::remember('shop:home:latest_products', now()->addMinutes(30), function () {
            return Product::where('is_active', true)
                ->latest()
                ->take(5)
                ->with('media')
                ->get()
                ->map(fn ($product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'price' => (float) $product->price,
                    'discount_price' => $product->discount_price ? (float) $product->discount_price : null,
                    'image' => $product->getFirstMediaUrl('images'),
                ]);
        });

        $categories = Cache::remember('shop:home:categories', now()->addHours(12), function () {
            return ProductCategory::where('is_active', true)
                ->withCount('products')
                ->with('media')
                ->get()
                ->map(fn ($category) => [
                    'id' => $category->id,
                    'slug' => $category->slug,
                    'name' => $category->name,
                    'image' => $category->getFirstMediaUrl('category_image'),
                    'product_count' => $category->products_count,
                ]);
        });

        return inertia('shop/Index', [
            'heroes' => $heroes,
            'latest_products' => $latestProducts,
            'categories' => $categories,
        ]);
    }

    public function shop(Request $request)
    {
        $cacheKey = 'shop:list:' . md5(json_encode($request->only([
            'search', 'category', 'sort', 'page'
        ])));

        $data = Cache::remember($cacheKey, now()->addMinutes(10), function () use ($request) {

            $query = Product::query()
                ->where('is_active', true)
                ->with(['category', 'media']);

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

            return [
                'products' => $query->paginate(15)->withQueryString(),
                'categories' => ProductCategory::where('is_active', true)->get(),
            ];
        });

        return Inertia::render('shop/Shop', [
            'products' => $data['products'],
            'categories' => $data['categories'],
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
        $cacheKey = "product:detail:{$slug}";

        $product = Cache::remember($cacheKey, now()->addHours(6), function () use ($slug) {
            $product = Product::where('slug', $slug)
                ->where('is_active', true)
                ->with([
                    'category:id,name,slug',
                    'media',
                    'variants.media',
                    'variants.variantValues.attributeValue',
                ])
                ->firstOrFail();

            $mapMedia = fn ($media) => [
                'url' => $media->original_url,
                'type' => str_starts_with($media->mime_type, 'video/') ? 'video' : 'image',
            ];

            return [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => (float) $product->price,
                'description' => $product->description,
                'category' => $product->category,
                'images' => $product->media->map($mapMedia),
                'variants' => $product->variants->map(function ($variant) use ($mapMedia) {
                    return [
                        'id' => $variant->id,
                        'label' => $variant->variantValues
                            ->pluck('attributeValue.value')
                            ->implode(' '),
                        'images' => $variant->media->map($mapMedia),
                        'price' => (float) $variant->price,
                    ];
                }),
            ];
        });

        return Inertia::render('shop/ProductDetail', [
            'product' => $product,
        ]);
    }


    public function category($slug)
    {
        $cacheKey = "category:{$slug}:page:" . request('page', 1);

        $data = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($slug) {
            $category = ProductCategory::where('slug', $slug)->firstOrFail();

            return [
                'category' => $category,
                'products' => Product::where('category_id', $category->id)
                    ->where('is_active', true)
                    ->with('media')
                    ->paginate(12),
            ];
        });

        return Inertia::render('shop/Category', $data);
    }
}
