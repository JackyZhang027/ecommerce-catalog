<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Product;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

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

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            // ✅ generate slug from name
            $category->slug = Str::slug($category->name);

            // ensure uniqueness
            $originalSlug = $category->category;
            $counter = 1;

            while (static::where('slug', $category->slug)->exists()) {
                $category->slug = "{$originalSlug}-{$counter}";
                $counter++;
            }
        });

        static::updating(function ($category) {
            // only regenerate slug if name changed
            if ($category->isDirty('name')) {
                $category->slug = Str::slug($category->name);
                $originalSlug = $category->slug;
                $counter = 1;

                while (static::where('slug', $category->slug)->where('id', '!=', $category->id)->exists()) {
                    $category->slug = "{$originalSlug}-{$counter}";
                    $counter++;
                }
            }
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
