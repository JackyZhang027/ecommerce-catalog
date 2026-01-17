<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
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
        'has_variant',
        'is_active',
    ];
    protected $appends = ['stock', 'sell_price', 'first_image_url'];

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

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function getStockAttribute()
    {
        if (($this->variant_count ?? 0) > 0) {
            return ($this->variant_purchased_qty ?? 0)
                 - ($this->variant_sold_qty ?? 0);
        }

        return ($this->product_purchased_qty ?? 0)
             - ($this->product_sold_qty ?? 0);
    }

    public function getSellingPriceAttribute(): float
    {
        return (float) $this->price;
    }

    public function getFirstImageUrlAttribute()
    {
        return $this->getFirstMediaUrl('images') ?: asset('images/placeholder.png');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
             ->width(368)
             ->height(232)
             ->sharpen(10);
    }
    
}
