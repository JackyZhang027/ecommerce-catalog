<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\SettingApp;
use Illuminate\Http\Request;
use App\Helpers\EcommerceHelper;

class SettingAppController extends Controller
{
    public function edit()
    {
        $setting = SettingApp::first();
        return Inertia::render('settingapp/Form', ['setting' => $setting]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'app_name'   => 'required|string|max:255',
            'shop_name'   => 'required|string|max:255',
            'description'  => 'nullable|string',
            'logo'       => 'nullable|file|image|max:2048',
            'favicon'    => 'nullable|file|image|max:1024',
            'color'      => 'nullable|string|max:20',
            'seo'        => 'nullable|array',
            'whatsapp_number' => 'nullable|string|max:20',
            'whatsapp_message_template' => 'nullable|string',
        ]);

        $setting = SettingApp::firstOrNew();

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logo', 'public');
        } else {
            unset($data['logo']);
        }

        if ($request->hasFile('favicon')) {
            $data['favicon'] = $request->file('favicon')->store('favicon', 'public');
        } else {
            unset($data['favicon']);
        }

        $setting->fill($data)->save();
        EcommerceHelper::clearCache();

        return redirect()->back()->with('success', 'Pengaturan berhasil disimpan.');
    }
}
