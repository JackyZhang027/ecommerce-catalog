<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'reference',
        'sale_date',
        'subtotal',
        'discount',
        'total',
        'note',
    ];

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

}
