<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FloatingContact extends Model
{
    protected $fillable = [
        'name',
        'whatsapp_number',
        'whatsapp_message_template',
        'is_active',
    ];
}
