<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingAppSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('setting_app')->insert([
            'shop_name' => 'My Ecommerce Shop',
            'app_name' => 'MyShop',
            'description' => 'Welcome to MyShop — your one-stop online store for everything you love!',
            'logo' => '/storage/settings/logo.png',
            'favicon' => '/storage/settings/favicon.ico',
            'color' => '#2563eb', // Tailwind blue-600
            'seo' => json_encode([
                'title' => 'MyShop - Best Online Store',
                'keywords' => 'ecommerce, online shop, best deals, myshop',
                'description' => 'Shop the best products online with MyShop. Fast delivery and trusted quality.',
            ]),
            'whatsapp_number' => '6281234567890',
            'whatsapp_message_template' => 'Hello, I’m interested in your product!',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
