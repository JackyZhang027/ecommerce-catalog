<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Supplier;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query();

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Sorting
        $allowedSorts = ['id', 'name', 'email', 'phone', 'is_active', 'created_at'];

        if ($sort = $request->input('sort')) {
            if (in_array($sort, $allowedSorts)) {
                $direction = $request->input('direction', 'asc');
                $query->orderBy($sort, $direction);
            }
        } else {
            $query->orderBy('id', 'desc');
        }

        $suppliers = $query
            ->paginate($request->input('per_page', 10))
            ->withQueryString();

        return inertia('suppliers/Index', [
            'suppliers' => [
                'data' => $suppliers->items(),
                'meta' => [
                    'current_page' => $suppliers->currentPage(),
                    'from' => $suppliers->firstItem(),
                    'to' => $suppliers->lastItem(),
                    'total' => $suppliers->total(),
                    'last_page' => $suppliers->lastPage(),
                    'links' => $suppliers->linkCollection(),
                ],
            ],
            'filters' => $request->only([
                'search',
                'sort',
                'direction',
                'per_page'
            ]),
        ]);
    }

    public function create()
    {
        return inertia('suppliers/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        Supplier::create($validated);

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Supplier created.');
    }

    public function edit(Supplier $supplier)
    {
        return inertia('suppliers/Form', [
            'supplier' => $supplier,
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        $supplier->update($validated);

        return back()->with('success', 'Supplier updated.');
    }

    public function destroy(Supplier $supplier)
    {
        // Optional safety check:
        // if ($supplier->purchases()->exists()) {
        //     return back()->withErrors([
        //         'error' => 'Supplier has purchases and cannot be deleted.'
        //     ]);
        // }

        $supplier->delete();

        return back()->with('success', 'Supplier deleted.');
    }

    public function toggle(Request $request, Supplier $supplier)
    {
        $supplier->update([
            'is_active' => $request->boolean('is_active'),
        ]);

        return back();
    }
}
