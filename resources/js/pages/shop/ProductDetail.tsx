import { Head, usePage } from "@inertiajs/react";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ProductDetail() {
    const { product, shared } = usePage<any>().props;
    const setting = shared.setting;

    const [activeVariant, setActiveVariant] = useState<any>(null);
    const [mainIndex, setMainIndex] = useState(0);
    const [zoomImage, setZoomImage] = useState<string | null>(null);

    // IMAGES:
    // Prefer variant images → fallback to product images
    const images =
        activeVariant && activeVariant.images?.length > 0
            ? activeVariant.images
            : product.images;

    const displayPrice = activeVariant ? activeVariant.price : product.price;
    const displayStock = (() => {
        if (product.variants.length === 0) {
            // No variants → use product stock
            return product.stock;
        }

        if (!activeVariant) {
            // Has variants but none selected → sum all variant stock
            return product.variants.reduce(
                (total: number, v: any) => total + (v.stock || 0),
                0
            );
        }

        // Variant selected → use variant stock
        return activeVariant.stock;
    })();


    // WhatsApp
    const phone = setting.whatsapp_number;
    const template =
        setting.whatsapp_message_template ??
        "I'm interested in {product_name} (Price: Rp {product_price})";

    const handleBuyNow = () => {
        const variantName = activeVariant ? ` (${activeVariant.label})` : "";
        const price = activeVariant ? activeVariant.price : product.price;

        const msg = template
            .replace("{product_name}", product.name + variantName)
            .replace("{product_price}", parseInt(price).toLocaleString());

        window.open(
            `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
            "_blank"
        );
    };

    const handleVariantClick = (variant: any) => {
        // If user clicks the same variant again → reset
        if (activeVariant?.id === variant.id) {
            setActiveVariant(null);
            setMainIndex(0);
            return;
        }

        // Otherwise select the new variant
        setActiveVariant(variant);
        setMainIndex(0);
    };


    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Head title={product.name} />
            <Header header={shared.header} setting={setting} />

            <main className="flex-grow w-full py-10 px-4 sm:px-6 lg:px-12">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
                    
                    {/* ---------- IMAGE GALLERY ---------- */}
                    <div className="flex gap-4">

                        {/* LEFT THUMBNAILS (Desktop Only) */}
                        <div
                            className="hidden md:flex flex-col gap-3"
                            style={{ maxHeight: "480px" }}
                        >
                            {images.map((img: string, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setMainIndex(i)}
                                    className={`w-20 h-20 rounded-xl border overflow-hidden ${
                                        i === mainIndex
                                            ? "border-blue-600"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <img
                                        src={img}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>

                        {/* MAIN IMAGE */}
                        <div className="relative w-full">
                            <div
                                className="rounded-xl overflow-hidden bg-gray-100"
                                style={{ height: "480px" }}
                            >
                                <img
                                    src={images[mainIndex]}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setZoomImage(images[mainIndex])}
                                />
                            </div>

                            {/* Zoom Icon */}
                            <button
                                onClick={() => setZoomImage(images[mainIndex])}
                                className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full cursor-pointer"
                            >
                                🔍
                            </button>

                            {/* MOBILE THUMBNAILS */}
                            <div className="flex md:hidden gap-3 mt-4 overflow-x-auto">
                                {images.map((img: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setMainIndex(i)}
                                        className={`w-20 h-20 rounded-xl border overflow-hidden ${
                                            i === mainIndex
                                                ? "border-blue-600"
                                                : "border-gray-300"
                                        }`}
                                    >
                                        <img
                                            src={img}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ---------- PRODUCT INFO ---------- */}
                    <div>
                        <h1 className="text-3xl font-bold text-black">{product.name}</h1>

                        <p className="text-2xl text-blue-600 font-semibold mt-3">
                            Rp {parseInt(displayPrice).toLocaleString("id-ID")}
                        </p>

                        <p className="mt-2 text-sm text-gray-600">
                            Stock:{" "}
                            {displayStock > 0
                                ? `${displayStock} pcs`
                                : "Out of stock"}
                        </p>
                        <p className="mt-2 text-gray-700 whitespace-pre-line">
                            {product.description}
                        </p>

                        {/* VARIANT LIST */}
                        {product.variants.length > 0 && (
                            <div className="mt-6">
                                <p className="font-medium mb-2 text-gray-800">
                                    Available Variants:
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v: any) => (
                                        <button
                                            key={v.id}
                                            onClick={() => handleVariantClick(v)}
                                            className={`px-4 py-2 rounded-lg border cursor-pointer ${
                                                activeVariant?.id === v.id
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-gray-100 text-gray-800 border-gray-300"
                                            }`}
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* BUY NOW / WHATSAPP */}
                        <div className="mt-8">
                            <Button
                                className="bg-green-600 text-white w-full py-4 rounded-xl cursor-pointer"
                                onClick={handleBuyNow}
                            >
                                Chat on WhatsApp
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer footer={shared.footer} />

            {/* ---------- ZOOM MODAL ---------- */}
            {zoomImage && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 cursor-zoom-out"
                    onClick={() => setZoomImage(null)}
                >
                    <img
                        src={zoomImage}
                        className="max-w-[100%] max-h-[100%] rounded-xl shadow-lg"
                    />
                </div>
            )}
        </div>
    );
}
