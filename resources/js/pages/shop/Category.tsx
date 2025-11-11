import { Head } from "@inertiajs/react";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import ProductCard from "@/components/ecommerce/ProductCard";
import { Product, Category } from "@/types";
import { useState } from "react";

interface CategoryPageProps {
    category: Category;
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    setting: any;
    categories: Category[];
}

export default function CategoryPage({ category, products, setting, categories }: CategoryPageProps) {
    const [loading, setLoading] = useState(false);

    return (
        <>
            <Head title={`${category.name} | ${setting?.site_name || "Shop"}`} />

            <Header categories={categories} setting={setting} />

            <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* ===== Hero Section ===== */}
                <section className="relative bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-center">
                        <h1 className="text-xl sm:text-3xl font-semibold text-gray-800 tracking-tight">
                            {category.name}
                        </h1>
                        {category.description && (
                            <p className="text-gray-500 max-w-2xl mx-auto mt-3 text-base">
                                {category.description}
                            </p>
                        )}
                        <div className="w-16 h-1 bg-green-500 mx-auto mt-4 rounded-full"></div>
                    </div>
                </section>

                {/* ===== Product Grid ===== */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {products.data.length === 0 ? (
                        <div className="text-center text-gray-500 py-20">
                            <p className="text-lg">No products found in this category.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
                                            "/placeholder.png"
                                        }
                                        setting={setting}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* ===== Pagination ===== */}
                    {products.last_page > 1 && (
                        <div className="flex justify-center mt-14 space-x-2">
                            {products.links.map((link, i) => {
                                const isDisabled = !link.url;
                                const label = link.label
                                    .replace("&laquo;", "«")
                                    .replace("&raquo;", "»");

                                return (
                                    <button
                                        key={i}
                                        disabled={isDisabled}
                                        onClick={() => {
                                            if (isDisabled) return;
                                            setLoading(true);
                                            window.location.href = link.url!;
                                        }}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                            link.active
                                                ? "bg-green-600 text-white shadow"
                                                : "bg-white text-gray-700 hover:bg-gray-100 border"
                                        } ${
                                            isDisabled
                                                ? "opacity-50 cursor-not-allowed"
                                                : "cursor-pointer"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            <Footer setting={setting} />
        </>
    );
}
