<?php

namespace App\Models;

use App\Models\SaleItemBatch;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'product_variant_id',
        'qty',
        'price',
        'discount',
        'subtotal',
    ];
    protected $casts = [
        'price' => 'float',
        'total' => 'float',
        'qty' => 'float',
    ];

    public function getAvailableQtyAttribute()
    {
        return $this->qty_in - $this->qty_out;
    }

    public function batches()
    {
        return $this->hasMany(SaleItemBatch::class);
    }
}
