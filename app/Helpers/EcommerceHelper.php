<?php

namespace App\Helpers;

use App\Models\SettingApp;
use App\Models\ProductCategory;
use App\Models\FloatingContact;
use Illuminate\Support\Facades\Cache;

class EcommerceHelper
{
    public static function sharedData()
    {
        return Cache::remember('ecommerce_shared_data', now()->addHours(6), function () {
            $setting = SettingApp::first();
            $contacts = FloatingContact::where('is_active', true)->get();

            $categories = ProductCategory::whereNull('parent_id')
                ->where('is_active', true)
                ->with('children')
                ->get();

            $header = [
                'logo' => $setting->logo ? asset('storage/' . $setting->logo) : asset('images/logo.svg'),
                'menus' => $categories->map(function ($cat) {
                    return [
                        'label' => $cat->name,
                        'url' => route('shop.category', $cat->slug),
                        'children' => $cat->children->map(function ($child) {
                            return [
                                'label' => $child->name,
                                'url' => route('shop.category', $child->slug),
                                'children' => $child->children->map(function ($grand) {
                                    return [
                                        'label' => $grand->name,
                                        'url' => route('shop.category', $grand->slug),
                                    ];
                                }),
                            ];
                        }),
                    ];
                }),
            ];

            $footer = [
                'logo' => asset('images/logo.svg'),
                'name' => 'My E-Commerce Store',
                'description' => 'Your one-stop shop for everything.',
                'links' => [
                    ['label' => 'About', 'url' => '#'],
                ],
                "contacts" => $contacts->map(function ($contact) {
                    return [
                        'label' => $contact->name,
                        'whatsapp_number' => $contact->whatsapp_number,
                        'whatsapp_message_template' => $contact->whatsapp_message_template,
                    ];
                }),
            ];

            return compact('setting', 'header', 'footer');
        });
    }

    public static function clearCache()
    {
        Cache::forget('ecommerce_shared_data');
    }
}
