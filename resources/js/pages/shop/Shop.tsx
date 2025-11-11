import { Head, usePage, router } from "@inertiajs/react";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import ProductCard from "@/components/ecommerce/ProductCard";
import { useState } from "react";
import FilterBar from "@/components/ecommerce/FilterBar";

export default function ShopPage() {
    const { products, categories, setting, filters, header, footer } = usePage<{
        products: {
            data: any[];
            links: any[];
        };
        categories: any[];
        filters: any;
        header: any;
        footer: any;
        setting?: { whatsapp_number?: string; whatsapp_message_template?: string };
    }>().props;

    const [search, setSearch] = useState(filters?.search ?? "");
    const [category, setCategory] = useState(filters?.category ?? "");
    const [sort, setSort] = useState(filters?.sort ?? "");
    

    const handleFilter = () => {
        router.get(
            route("shop.index"),
            { search, category, sort },
            { preserveScroll: true, preserveState: true }
        );
    };

    return (
        <div className="bg-gray-50">
            <Head title="Shop" />
            <Header />

            <main className="flex-grow w-full">
                <FilterBar
                    search={search}
                    setSearch={setSearch}
                    category={category}
                    setCategory={setCategory}
                    sort={sort}
                    setSort={setSort}
                    categories={categories}
                    onFilter={handleFilter}
                />

                {/* ✅ use products.data instead of products */}
                <div className="bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
                    {products?.data?.length ? (
                        <div
                        className="
                            grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
                            gap-4 sm:gap-6 md:gap-8
                        "
                        >
                        {products.data.map((product) => (
                            <ProductCard
                                key={product.id}
                                slug={product.slug} 
                                name={product.name}
                                price={product.price}
                                image={
                                    product.media?.[0]?.original_url ||
                                    product.images?.[0] ||
                                    product.image ||
                                    '/placeholder.png'
                                }
                                setting={setting}
                            />
                        ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <img
                            src="/empty-state.svg"
                            alt="No products"
                            className="w-40 mb-4 opacity-70"
                        />
                        <p className="text-center text-sm">No products found matching your filters.</p>
                        </div>
                    )}
                </div>



                {/* ✅ Pagination */}
                {products?.data?.length > 0 && products?.links?.length > 3 && (
                    <div className="flex justify-center py-10">
                        {products.links.map((link: any, i: number) => (
                        <button
                            key={i}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`px-3 py-2 rounded-md text-sm mx-1 ${
                            link.active
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-100"
                            } ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                        ))}
                    </div>
                )}

            </main>

            <Footer footer={footer} />
        </div>
    );
}
