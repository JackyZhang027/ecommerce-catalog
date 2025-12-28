<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StockBatch extends Model
{
    use HasFactory;

    protected $table = 'stock_batches';

    protected $fillable = [
        'product_id',
        'product_variant_id',
        'purchase_item_id',
        'qty_in',
        'qty_out',
        'cost',
        'received_at',
    ];

    protected $casts = [
        'qty_in' => 'decimal:2',
        'qty_out' => 'decimal:2',
        'cost' => 'decimal:2',
        'received_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function purchaseItem()
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes (FIFO helpers)
    |--------------------------------------------------------------------------
    */

    /**
     * Only batches that still have remaining stock
     */
    public function scopeAvailable($query)
    {
        return $query->whereRaw('(qty_in - qty_out) > 0');
    }

    /**
     * FIFO ordering (oldest stock first)
     */
    public function scopeFifo($query)
    {
        return $query->orderBy('received_at')->orderBy('id');
    }

    /**
     * Filter by product (and optional variant)
     */
    public function scopeForProduct($query, int $productId, ?int $variantId = null)
    {
        return $query
            ->where('product_id', $productId)
            ->when(
                $variantId,
                fn ($q) => $q->where('product_variant_id', $variantId)
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Remaining quantity in this batch
     */
    public function getQtyRemainingAttribute()
    {
        return bcsub($this->qty_in, $this->qty_out, 2);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Consume stock from this batch (FIFO-safe)
     *
     * @throws \Exception
     */
    public function consume(float $qty): void
    {
        if ($qty <= 0) {
            throw new \InvalidArgumentException('Quantity must be greater than zero.');
        }

        if ($qty > $this->qty_remaining) {
            throw new \Exception('Not enough stock in this batch.');
        }

        $this->increment('qty_out', $qty);
    }
}
