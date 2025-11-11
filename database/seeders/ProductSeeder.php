<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductCategory;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $electronics = ProductCategory::where('slug', 'electronics')->first();
        $fashion = ProductCategory::where('slug', 'fashion')->first();

        Product::create([
            'name' => 'Wireless Headphones',
            'price' => 99.99,
            'stock' => 5,
            'category_id' => $electronics->id,
        ]);

        Product::create([
            'name' => 'Smartwatch Pro',
            'price' => 199.00,
            'stock' => 5,
            'category_id' => $electronics->id,
        ]);

        Product::create([
            'name' => 'Leather Shoes',
            'price' => 79.00,
            'stock' => 5,
            'category_id' => $fashion->id,
        ]);
    }
}
