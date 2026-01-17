<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ProductVariant extends Model implements HasMedia
{
    use InteractsWithMedia;
    protected $fillable = [
        'product_id',
        'name',
        'sku',
        'price',
        'stock',
        'is_active',
        'discount_price',
    ];
    protected $appends = ['stock', 'selling_price'];
    
    protected $casts = [
        'price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];


    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    
    public function variantValues()
    {
        return $this->hasMany(ProductVariantValue::class);
    }

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function getSellingPriceAttribute(): float
    {
        return $this->discount_price !== null
            ? (float) $this->discount_price
            : (float) $this->price;
    }

    public function getStockAttribute()
    {
        $purchased = $this->purchaseItems()->sum('qty');
        $sold = $this->saleItems()->sum('qty');

        return $purchased - $sold;
    }

}
