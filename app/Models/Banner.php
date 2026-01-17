<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Cache;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\HasMedia;

class Banner extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'position',
        'title',
        'subtitle',
        'button_text',
        'button_link',
        'order',
        'is_active',
    ];

    protected static function booted()
    {
        static::saved(fn () => Cache::forget('shop:home:heroes'));
        static::deleted(fn () => Cache::forget('shop:home:heroes'));
    }
}
