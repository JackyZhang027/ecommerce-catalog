import { router } from "@inertiajs/react";

interface ProductCardProps {
  id?: number;
  slug?: string;
  name: string;
  price: number;
  image: string;
  setting?: {
    whatsapp_number?: string;
    whatsapp_message_template?: string;
  };
}

export default function ProductCard({
  id,
  slug,
  name,
  price,
  image,
  setting,
}: ProductCardProps) {
  const phoneNumber = setting?.whatsapp_number ?? "6280000000000";
  const template =
    setting?.whatsapp_message_template ??
    "Hello, I'm interested in buying *{product_name}* (Price: Rp {product_price}).";

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation(); // ⛔ prevent card click
    const message = template
      .replace("{product_name}", name)
      .replace("{product_price}", price.toLocaleString());
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleCardClick = () => {
    const productUrl = slug ? `/products/${slug}` : `/products/${id}`;
    router.visit(productUrl);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 cursor-pointer"
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-44 sm:h-52 md:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Details */}
      <div className="p-3 sm:p-4 flex flex-col">
        <h3 className="font-medium text-gray-800 text-sm sm:text-base truncate">{name}</h3>
        <p className="text-blue-600 font-semibold text-base sm:text-lg mt-1">
          Rp {price.toLocaleString()}
        </p>

        <button
          onClick={handleBuyNow}
          className="mt-3 bg-green-600 text-white rounded-full text-center py-2 text-xs sm:text-sm hover:bg-green-700 transition-all shadow-md hover:shadow-green-200 cursor-pointer"
        >
          Chat on WhatsApp
        </button>
      </div>
    </div>
  );
}
