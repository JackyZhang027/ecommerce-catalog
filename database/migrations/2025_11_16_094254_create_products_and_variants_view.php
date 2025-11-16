<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
        CREATE VIEW products_and_variants AS
            -- PRODUCTS WITHOUT VARIANT
            SELECT 
                'product' AS type,
                p.id AS product_id,
                NULL AS variant_id,
                p.name AS name,
                NULL AS sku,
                p.price,
                p.stock,
                p.is_active,
                p.category_id,
                c.name AS category_name
            FROM products p
            LEFT JOIN product_categories c ON c.id = p.category_id
            WHERE p.is_active = 1 AND p.has_variant = 0

        UNION ALL

            -- VARIANTS
            SELECT 
                'variant' AS type,
                pv.product_id,
                pv.id AS variant_id,
                pv.name AS name,
                pv.sku,
                COALESCE(pv.discount_price, pv.price) AS price,
                pv.stock,
                pv.is_active,
                p.category_id,
                c.name AS category_name
            FROM product_variants pv
            JOIN products p ON p.id = pv.product_id
            JOIN product_categories c ON c.id = p.category_id
            WHERE pv.is_active = 1 AND p.is_active = 1 AND p.has_variant = 1;

        ");
    }

    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS products_and_variants");
    }
};
