<?php
namespace App\Services;

use App\Models\StockBatch;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Exception;

class FifoSaleService
{
    /**
     * Deduct FIFO and record batch usage
     */
    public function deduct(
        SaleItem $saleItem,
        int $productId,
        ?int $variantId,
        float $qty
    ): void {
        $remaining = $qty;

        $batches = StockBatch::query()
            ->where('product_id', $productId)
            ->when($variantId, fn ($q) =>
                $q->where('product_variant_id', $variantId)
            )
            ->whereRaw('qty_in > qty_out')
            ->orderBy('received_at')
            ->lockForUpdate()
            ->get();
        
        foreach ($batches as $batch) {
            if ($remaining <= 0) break;

            $available = $batch->qty_in - $batch->qty_out;
            $take = min($available, $remaining);

            // deduct
            $batch->increment('qty_out', $take);

            // record usage
            $saleItem->batches()->create([
                'stock_batch_id' => $batch->id,
                'qty' => $take,
                'cost' => $batch->cost,
            ]);

            $remaining -= $take;
        }

        if ($remaining > 0) {
            throw new Exception('Insufficient stock (FIFO)');
        }
    }

    /**
     * Restore FIFO from recorded batch usage
     */
    public function restore(SaleItem $saleItem): void
    {
        foreach ($saleItem->batches as $usage) {
            $batch = $usage->stockBatch;

            $batch->decrement('qty_out', $usage->qty);
        }

        // clean up usage records
        $saleItem->batches()->delete();
    }
}
