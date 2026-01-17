<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Product;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Support\Facades\Cache;

class ProductCategory extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'order',
        'is_active',
        'meta_title',
        'meta_description',
        'meta_keywords',
    ];


    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted()
    {
        static::saving(function ($category) {

            if (! $category->exists || $category->isDirty('name')) {

                $baseSlug = Str::slug($category->name);
                $slug = $baseSlug;
                $counter = 1;

                while (
                    static::where('slug', $slug)
                        ->when($category->exists, fn ($q) => $q->where('id', '!=', $category->id))
                        ->exists()
                ) {
                    $slug = "{$baseSlug}-{$counter}";
                    $counter++;
                }

                $category->slug = $slug;
            }
        });
        
        static::saved(function () {
            Cache::forget('shop:home:categories');
        });

        static::deleted(function () {
            Cache::forget('shop:home:categories');
        });

    }


    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    public function registerMediaConversions(\Spatie\MediaLibrary\MediaCollections\Models\Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(300)
            ->height(300)
            ->sharpen(10);
    }

}
