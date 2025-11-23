import { Head, usePage } from "@inertiajs/react";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PlayCircle, Image, Maximize } from "lucide-react"; // Import Icons

// Define a type for your media items
interface MediaItem {
    url: string;
    type: 'image' | 'video'; // Assuming your backend provides this type
}

// Extend existing types (assuming product and variant have a media property now)
interface ProductProps {
    product: {
        id: number;
        name: string;
        price: number;
        stock: number;
        description: string;
        images: MediaItem[]; // Updated to MediaItem[]
        variants: any[];
    };
    shared: {
        setting: {
            whatsapp_number: string;
            whatsapp_message_template: string;
        };
        // ... other shared data
    };
}

export default function ProductDetail() {
    // Cast to the updated type for better type safety
    const { product, shared } = usePage<ProductProps>().props;
    const setting = shared.setting;

    const [activeVariant, setActiveVariant] = useState<any>(null);
    const [mainIndex, setMainIndex] = useState(0);
    const [zoomMedia, setZoomMedia] = useState<MediaItem | null>(null); // Use MediaItem for zoom

    // IMAGES/MEDIA:
    // Prefer variant media → fallback to product media
    const mediaItems: MediaItem[] =
        activeVariant && activeVariant.images?.length > 0
            ? activeVariant.images
            : product.images;

    const displayPrice = activeVariant ? activeVariant.price : product.price;
    const displayStock = (() => {
        // ... (stock calculation remains the same)
        if (product.variants.length === 0) {
            return product.stock;
        }

        if (!activeVariant) {
            return product.variants.reduce(
                (total: number, v: any) => total + (v.stock || 0),
                0
            );
        }

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
        if (activeVariant?.id === variant.id) {
            setActiveVariant(null);
            setMainIndex(0);
            return;
        }

        setActiveVariant(variant);
        setMainIndex(0);
    };
    
    // Helper function to render the thumbnail content
    const renderThumbnail = (item: MediaItem) => {
        if (item.type === 'video') {
            return (
                <div className="relative w-full h-full flex items-center justify-center bg-gray-200 cursor-pointer">
                    {/* Placeholder for video thumbnail, or use a cover image */}
                    <PlayCircle className="w-8 h-8 text-blue-600 opacity-70" />
                    <p className="absolute bottom-1 right-1 text-xs text-black/70 font-semibold bg-white/80 px-1 rounded">Video</p>
                </div>
            );
        }
        return (
            <img
                src={item.url}
                className="w-full h-full object-cover cursor-pointer"
                alt="Product thumbnail"
            />
        );
    }
    
    // Helper function to render the main media content
    const renderMainMedia = (item: MediaItem) => {
        if (item.type === 'video') {
            return (
                <video
                    key={item.url} // Key forces re-render when video changes
                    src={item.url}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-cover"
                    style={{ maxHeight: "480px" }}
                >
                    Your browser does not support the video tag.
                </video>
            );
        }
        return (
            <img
                src={item.url}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setZoomMedia(item)}
                alt="Main product media"
            />
        );
    }

    const currentMedia = mediaItems[mainIndex];

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Head title={product.name} />
            <Header />

            <main className="flex-grow w-full py-10 px-4 sm:px-6 lg:px-12">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
                    
                    {/* ---------- IMAGE/VIDEO GALLERY ---------- */}
                    <div className="flex gap-4">

                        {/* LEFT THUMBNAILS (Desktop Only) */}
                        <div
                            className="hidden md:flex flex-col gap-3"
                            style={{ maxHeight: "480px" }}
                        >
                            {mediaItems.map((item: MediaItem, i: number) => (
                                <button
                                    key={item.url} // Use URL as key
                                    onClick={() => setMainIndex(i)}
                                    className={`w-20 h-20 rounded-xl border overflow-hidden ${
                                        i === mainIndex
                                            ? "border-blue-600 ring-2 ring-blue-600"
                                            : "border-gray-300"
                                    } transition-all duration-150`}
                                >
                                    {renderThumbnail(item)}
                                </button>
                            ))}
                        </div>

                        {/* MAIN MEDIA DISPLAY */}
                        <div className="relative w-full">
                            <div
                                className="rounded-xl overflow-hidden bg-gray-100"
                                style={{ height: "480px" }}
                            >
                                {currentMedia && renderMainMedia(currentMedia)}
                            </div>

                            {/* Zoom Icon (Only show for images, or when media is selected) */}
                            {currentMedia && currentMedia.type === 'image' && (
                                <button
                                    onClick={() => setZoomMedia(currentMedia)}
                                    className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full cursor-pointer hover:bg-black/80 transition"
                                >
                                    <Maximize className="w-5 h-5" />
                                </button>
                            )}

                            {/* MOBILE THUMBNAILS */}
                            <div className="flex md:hidden gap-3 mt-4 overflow-x-auto">
                                {mediaItems.map((item: MediaItem, i: number) => (
                                    <button
                                        key={item.url}
                                        onClick={() => setMainIndex(i)}
                                        className={`w-20 h-20 flex-shrink-0 rounded-xl border overflow-hidden ${
                                            i === mainIndex
                                                ? "border-blue-600 ring-2 ring-blue-600"
                                                : "border-gray-300"
                                        } transition-all duration-150`}
                                    >
                                        {renderThumbnail(item)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ---------- PRODUCT INFO (No changes needed here) ---------- */}
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
                                className="bg-green-600 hover:bg-green-700 text-white w-full py-4 rounded-xl cursor-pointer"
                                onClick={handleBuyNow}
                            >
                                Chat on WhatsApp
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* ---------- ZOOM MODAL (Updated to handle video/image) ---------- */}
            {zoomMedia && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-zoom-out p-4"
                    onClick={() => setZoomMedia(null)}
                >
                    {zoomMedia.type === 'video' ? (
                         <video
                            src={zoomMedia.url}
                            controls
                            autoPlay
                            loop
                            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-lg"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking video
                        />
                    ) : (
                        <img
                            src={zoomMedia.url}
                            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-lg"
                            alt="Zoomed product image"
                        />
                    )}
                    <button
                        className="absolute top-4 right-4 text-white text-2xl font-bold p-2"
                        onClick={() => setZoomMedia(null)}
                    >
                        &times;
                    </button>
                </div>
            )}
        </div>
    );
}