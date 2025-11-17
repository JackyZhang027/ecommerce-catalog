import { router } from "@inertiajs/react";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  id?: number;
  slug?: string;
  name: string;
  price: number;
  image: string;
  discount_price?: number;
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
  discount_price,
  setting,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const hasDiscount = discount_price && discount_price < price;
  const discountPercentage = hasDiscount
    ? Math.round(((price - discount_price!) / price) * 100)
    : 0;

  const displayPrice = hasDiscount ? discount_price! : price;
  const formattedPrice = Number(displayPrice).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
  });
  const formattedOriginalPrice = Number(price).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
  });

  const phoneNumber = setting?.whatsapp_number ?? "6280000000000";
  const template =
    setting?.whatsapp_message_template ??
    "Hello, I'm interested in buying *{product_name}* (Price: Rp {product_price}).";

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = template
      .replace("{product_name}", name)
      .replace("{product_price}", formattedPrice);
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-lg overflow-hidden transition-all duration-300 cursor-pointer"
      style={{
        boxShadow: isHovered 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{
            transform: isHovered ? 'scale(1.1)' : 'scale(1)'
          }}
        />
        
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPercentage}%
          </div>
        )}

        {/* WhatsApp Button - slides up on hover */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-green-600 text-white py-2 flex items-center justify-center gap-2 transition-transform duration-300"
          style={{
            transform: isHovered ? 'translateY(0)' : 'translateY(100%)'
          }}
          onClick={handleWhatsApp}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">Chat on WhatsApp</span>
        </div>
      </div>

      {/* Details */}
      <div className="p-3 md:p-4">
        <h3 
          className="font-semibold mb-2 line-clamp-2 transition-colors duration-300"
          style={{
            color: isHovered ? '#4b5563' : '#111827'
          }}
        >
          {name}
        </h3>
        
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-gray-900">
                Rp. {formattedPrice}
              </span>
              <span className="text-sm text-gray-400 line-through">
                Rp. {formattedOriginalPrice}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              Rp. {formattedPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}