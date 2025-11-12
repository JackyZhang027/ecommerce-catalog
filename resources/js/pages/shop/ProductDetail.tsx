import { Head, usePage } from "@inertiajs/react";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ProductDetail() {
    const { product, header, footer, shared } = usePage<{
        product: any;
        shared: any;
    }>().props;

    const setting = shared.setting || {};
    const images = product.media.length>0 ? product.media?.map((m: any) => m.original_url) : ["/assets/images/placeholder.jpg"];

    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchEndX, setTouchEndX] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEndX(null);
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        const distance = touchStartX - touchEndX;
        if (Math.abs(distance) < minSwipeDistance) return;
        if (distance > 0) {
            // swipe left
            setMainImageIndex((prev) =>
                prev + 1 < images.length ? prev + 1 : 0
            );
        } else {
            // swipe right
            setMainImageIndex((prev) =>
                prev - 1 >= 0 ? prev - 1 : images.length - 1
            );
        }
    };

    const mainImage = images[mainImageIndex];

    // ✅ WhatsApp Buy Now handler
    const phoneNumber = setting?.whatsapp_number ?? "6280000000000";
    const template =
        setting?.whatsapp_message_template ??
        "Hello, I'm interested in buying *{product_name}* (Price: Rp {product_price}).";

    const handleBuyNow = () => {
        const message = template
            .replace("{product_name}", product.name)
            .replace("{product_price}", parseInt(product.price).toLocaleString());
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
            message
        )}`;
        window.open(url, "_blank");
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Head title={product.name} />
            <Header header={header} setting={setting} />

            <main className="flex-grow w-full py-10 px-4 sm:px-6 lg:px-12">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14">
                    {/* LEFT — IMAGE GALLERY */}
                    <div>
                        <div
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                            className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative"
                        >
                            <img
                                src={mainImage}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-300"
                            />

                            {/* Dots indicator (mobile only) */}
                            {images.length > 1 && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 md:hidden">
                                    {images.map((_, i) => (
                                        <span
                                            key={i}
                                            className={`w-2.5 h-2.5 rounded-full transition ${i === mainImageIndex
                                                    ? "bg-blue-600"
                                                    : "bg-gray-300"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Thumbnails (desktop only) */}
                        {images.length > 1 && (
                            <div className="hidden md:flex flex-wrap gap-3 mt-4">
                                {images.map((img: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setMainImageIndex(i)}
                                        className={`w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${mainImage === img
                                                ? "border-blue-600 ring-2 ring-blue-200"
                                                : "border-gray-200 hover:border-gray-400"
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt=""
                                            className="object-cover w-full h-full"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT — PRODUCT INFO */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                                {product.name}
                            </h1>

                            <p className="text-gray-500 mt-2 text-sm">
                                Category:{" "}
                                <span className="font-medium text-gray-700">
                                    {product.category?.name ?? "Uncategorized"}
                                </span>
                            </p>

                            <p className="text-3xl font-semibold text-blue-600 mt-4">
                                Rp {parseInt(product.price).toLocaleString("id-ID")}
                            </p>

                            <div className="mt-6 text-gray-700 leading-relaxed whitespace-pre-line">
                                {product.description}
                            </div>

                            <ul className="mt-6 space-y-2 text-sm text-gray-600 border-t border-gray-200 pt-4">
                                <li>
                                    <span className="font-medium text-gray-800">Stock:</span>{" "}
                                    {product.stock > 0
                                        ? `${product.stock} pcs`
                                        : "Out of stock"}
                                </li>
                            </ul>
                            {/* ACTION BUTTONS */}
                            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                                <Button
                                    size="lg"
                                    onClick={handleBuyNow}
                                    className="bg-green-600 hover:bg-green-700 text-white flex-1 py-6 text-base font-medium rounded-xl shadow-md hover:shadow-green-200"
                                >
                                    Chat on WhatsApp
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <Footer footer={footer} />
        </div>
    );
}
