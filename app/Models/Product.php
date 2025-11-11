<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use App\Models\ProductCategory;

class Product extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'stock',
        'category_id',
        'is_active',
    ];

    protected static function booted()
    {
        static::creating(function ($product) {
            $product->slug = \Str::slug($product->name);
        });

        static::updating(function ($product) {
            if ($product->isDirty('name')) {
                $product->slug = \Str::slug($product->name);
            }
        });
    }

    public function category()
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function getFirstImageUrlAttribute()
    {
        return $this->getFirstMediaUrl('images') ?: asset('images/placeholder.png');
    }

}
