<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FifoConsumption extends Model
{
    protected $fillable = [
        'sale_item_id',
        'stock_batch_id',
        'qty',
        'cost',
    ];

    /* =====================
       RELATIONSHIPS
    ===================== */

    public function saleItem()
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function stockBatch()
    {
        return $this->belongsTo(StockBatch::class);
    }
}
