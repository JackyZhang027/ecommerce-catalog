<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FloatingContact;
use Illuminate\Support\Facades\Cache;

class FloatingContactController extends Controller
{
    public function index(Request $request)
    {
        $query = FloatingContact::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($sort = $request->input('sort')) {
            $direction = $request->input('direction', 'asc');
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy('id', 'desc');
        }

        $contacts = $query->paginate($request->input('per_page', 10))->withQueryString();

        return inertia('floating_contacts/Index', [
            'contacts' => [
                'data' => $contacts->items(),
                'meta' => [
                    'current_page' => $contacts->currentPage(),
                    'from' => $contacts->firstItem(),
                    'to' => $contacts->lastItem(),
                    'total' => $contacts->total(),
                    'last_page' => $contacts->lastPage(),
                    'links' => $contacts->linkCollection(),
                ],
            ],
            'filters' => $request->only(['search', 'sort', 'direction', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'whatsapp_number' => ['required', 'string', 'max:20'],
            'whatsapp_message_template' => ['nullable', 'string'],
        ]);

        FloatingContact::create($validated);
        Cache::forget('ecommerce_shared_data');
        return redirect()->back()->with('success', 'Floating contact created successfully.');
    }

    public function update(FloatingContact $floating_contact, Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'whatsapp_number' => ['required', 'string', 'max:20'],
            'whatsapp_message_template' => ['nullable', 'string'],
        ]);

        $floating_contact->update($validated);
        Cache::forget('ecommerce_shared_data');
        return redirect()->back()->with('success', 'Floating contact updated successfully.');
    }

    public function destroy(FloatingContact $floating_contact)
    {
        $floating_contact->delete();
        Cache::forget('ecommerce_shared_data');
        return redirect()->back()->with('success', 'Floating contact deleted successfully.');
    }

    public function toggleActive(FloatingContact $floating_contact, Request $request)
    {
        $floating_contact->is_active = $request->input('is_active', $floating_contact->is_active);
        $floating_contact->save();
        Cache::forget('ecommerce_shared_data');
        return redirect()->back()->with('success', 'Floating contact status updated successfully.');
    }
}
