<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Banner;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    
    public function index(Request $request)
    {
        $query = Banner::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($sort = $request->input('sort')) {
            $direction = $request->input('direction', 'asc');
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('id', 'desc');
        }

        $banners = $query->paginate($request->input('per_page', 10))->withQueryString();

        return inertia('banner/Index', [
            'banners' => [
                'data' => $banners->items(),
                'meta' => [
                    'current_page' => $banners->currentPage(),
                    'from' => $banners->firstItem(),
                    'to' => $banners->lastItem(),
                    'total' => $banners->total(),
                    'last_page' => $banners->lastPage(),
                    'links' => $banners->linkCollection(),
                ],
            ],
            'filters' => $request->only(['search', 'sort', 'direction', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('banner/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'required|string|max:255',
            'button_text' => 'required|string|max:255',
            'button_link' => 'required|string|max:255',
            'order' => 'nullable|integer',
            'image' => ['required', 'image', 'max:2048'],
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);

        $banner = Banner::create($validated);

        // ✅ Attach a single image (replaces any previous)
        if ($request->hasFile('image')) {
            $banner->addMediaFromRequest('image')->toMediaCollection('banner_image');
        }
        return redirect()->route('banners.edit', $banner->id)->with('success', 'Banner created successfully');
    }

    public function edit(Banner $banner)
    {
        return Inertia::render('banner/Form', [
            'banner' => $banner->load('media'),
        ]);
    }

    public function update(Request $request, Banner $banner)
    {
        try{
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'subtitle' => 'required|string|max:255',
                'button_text' => 'required|string|max:255',
                'button_link' => 'required|string|max:255',
                'order' => 'nullable|integer',
                'image' => ['required', 'image', 'max:2048'],
            ]);

            $banner->update($validated);

            // ✅ Replace existing image if new one uploaded
            if ($request->hasFile('image')) {
                $banner->clearMediaCollection('banner_image');
                $banner->addMediaFromRequest('image')->toMediaCollection('banner_image');
            }
        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred while updating the banner: ' . $e->getMessage());
        }   
        return back()->with('success', 'Banner updated successfully');
    }

    public function destroy(Banner $banner)
    {
        dd();
        $banner->delete();

        return back()->with('success', 'Banner deleted successfully.');
    }

    public function toggleActive(Banner $banner)
    {
        $banner->is_active = !$banner->is_active;
        $banner->save();

        return back()->with('success', 'Banner status updated successfully.');
    }
    
}
