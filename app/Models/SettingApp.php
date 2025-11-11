<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SettingApp extends Model
{
    protected $table = 'setting_app';

    protected $fillable = [
        'app_name',
        'shop_name',
        'description',
        'logo',
        'favicon',
        'color',
        'seo',
        'whatsapp_number',
        'whatsapp_message_template',
    ];

    protected $casts = [
        'seo' => 'array',
    ];
}
