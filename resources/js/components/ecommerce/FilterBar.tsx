import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Filter, Loader2 } from "lucide-react";

interface Props {
    search: string;
    setSearch: (v: string) => void;
    category: string;
    setCategory: (v: string) => void;
    sort: string;
    setSort: (v: string) => void;
    categories: { id: number; name: string }[];
    onFilter: () => Promise<void> | void;
}

export default function FilterBar({
    search,
    setSearch,
    category,
    setCategory,
    sort,
    setSort,
    categories,
    onFilter,
}: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Trigger filter refresh when filters change (debounced)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            try {
                setLoading(true);
                await onFilter(); // support async calls (Inertia, API, etc)
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search, category, sort]);

    return (
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-sm mt-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {/* Title & Spinner */}
                <div className="flex items-center justify-between w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-blue-700"></h2>
                        {loading && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        type="button"
                        className="md:hidden flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-5 w-5" />
                        <span>{showFilters ? "Hide" : "Filter"}</span>
                    </button>
                </div>

                {/* Desktop Filters */}
                <div className="hidden md:flex items-center gap-3 w-full md:w-auto">
                    <FilterInputs
                        search={search}
                        setSearch={setSearch}
                        category={category}
                        setCategory={setCategory}
                        sort={sort}
                        setSort={setSort}
                        categories={categories}
                    />
                </div>
            </div>

            {/* Mobile Filters (collapsible) */}
            <div
                className={`md:hidden px-4 pb-4 overflow-hidden transition-all duration-300 ${showFilters ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <FilterInputs
                    search={search}
                    setSearch={setSearch}
                    category={category}
                    setCategory={setCategory}
                    sort={sort}
                    setSort={setSort}
                    categories={categories}
                />
            </div>
        </div>
    );
}

function FilterInputs({
    search,
    setSearch,
    category,
    setCategory,
    sort,
    setSort,
    categories,
}: {
    search: string;
    setSearch: (v: string) => void;
    category: string;
    setCategory: (v: string) => void;
    sort: string;
    setSort: (v: string) => void;
    categories: { id: number; name: string }[];
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-blue-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm transition text-black"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Category */}
            <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-2.5 text-blue-400 h-5 w-5" />
                <select
                    className="appearance-none w-full pl-10 pr-8 py-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm text-gray-700 transition"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Sort */}
            <div className="relative">
                <ArrowUpDown className="absolute left-3 top-2.5 text-blue-400 h-5 w-5" />
                <select
                    className="appearance-none w-full pl-10 pr-8 py-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm text-gray-700 transition"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <option value="">Sort by price</option>
                    <option value="low">Low → High</option>
                    <option value="high">High → Low</option>
                </select>
            </div>
        </div>
    );
}
