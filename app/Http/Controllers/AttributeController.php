<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Support\Str;

class AttributeController extends Controller
{
    public function index(Request $request)
    {
        $query = Attribute::with('values');

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $allowedSorts = ['id', 'name', 'is_active', 'created_at'];

        if ($sort = $request->input('sort')) {
            if (in_array($sort, $allowedSorts)) {
                $direction = $request->input('direction', 'asc');
                $query->orderBy($sort, $direction);
            }
        } else {
            $query->orderBy('id', 'desc');
        }

        $attributes = $query->paginate($request->input('per_page', 10))->withQueryString();

        return inertia('attributes/Index', [
            'attributes' => [
                'data' => $attributes->items(),
                'meta' => [
                    'current_page' => $attributes->currentPage(),
                    'from' => $attributes->firstItem(),
                    'to' => $attributes->lastItem(),
                    'total' => $attributes->total(),
                    'last_page' => $attributes->lastPage(),
                    'links' => $attributes->linkCollection(),
                ],
            ],
            'filters' => $request->only(['search', 'sort', 'direction', 'per_page']),
        ]);
    }

    public function create()
    {
        return inertia('attributes/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:attributes,slug',
            'values' => 'array',
            'values.*.value' => 'required|string|max:255',
        ]);

        $attribute = Attribute::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
        ]);

        foreach ($validated['values'] as $val) {
            $attribute->values()->create([
                'value' => $val['value'],
                'slug' => Str::slug($val['value']),
            ]);
        }

        return redirect()->route('attributes.index')->with('success', 'Attribute created.');
    }

    public function edit(Attribute $attribute)
    {
        $attribute->load('values');

        return inertia('attributes/Form', [
            'attribute' => $attribute,
        ]);
    }
    
    public function update(Request $request, Attribute $attribute)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => "nullable|string|max:255|unique:attributes,slug,{$attribute->id}",
            'values' => 'array',
            'values.*.id' => 'nullable|integer|exists:attribute_values,id',
            'values.*.value' => 'required|string|max:255',
        ]);

        $attribute->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
        ]);

        // Sync values
        $existingIds = $attribute->values()->pluck('id')->toArray();
        $sentIds = collect($validated['values'])->pluck('id')->filter()->toArray();

        // Delete removed values
        AttributeValue::whereIn('id', array_diff($existingIds, $sentIds))->delete();

        // Upsert current
        foreach ($validated['values'] as $val) {
            $attribute->values()->updateOrCreate(
                ['id' => $val['id'] ?? null],
                ['value' => $val['value'], 'slug' => Str::slug($val['value'])]
            );
        }

        return back()->with('success', 'Attribute updated.');
    }

}
