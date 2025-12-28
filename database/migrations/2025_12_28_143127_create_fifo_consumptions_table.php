<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fifo_consumptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stock_batch_id')->constrained()->cascadeOnDelete();

            $table->decimal('qty', 16, 2);
            $table->decimal('cost', 16, 2); // cost per unit at time of sale

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fifo_consumptions');
    }
};
