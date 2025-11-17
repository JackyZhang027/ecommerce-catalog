import { Link } from "@inertiajs/react";
import { ShoppingCart, Heart, Eye } from "lucide-react";
import { Head } from "@inertiajs/react";
import Header from "@/components/ecommerce/Header";
import Footer from "@/components/ecommerce/Footer";
import HeroSlider from "@/components/ecommerce/HeroSliders";
import { useState } from "react";

// Types for props
interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  discount_price?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  product_count: number;
}

interface Props {
  heroes: {
    title: string;
    subtitle?: string;
    image: string;
    button_text?: string;
    button_link?: string;
  };
  latest_products: Product[];
  categories: Category[];
}

export default function LandingPage({ heroes, latest_products, categories }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
        
    <Head title="Shop" />
    <Header />
      
        <HeroSlider heroes={heroes} />

      {/* Latest Products Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            New Arrivals
          </h2>
          <p className="text-gray-600 text-lg">
            Discover our latest collection
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {latest_products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/shop"
            className="inline-block border-2 border-gray-900 text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-900 hover:text-white transition"
          >
            View All Products
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Shop by Category
            </h2>
            <p className="text-gray-600 text-lg">
              Browse through your favorite categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <Footer/>
    </div>
  );
}

// Product Card Component with useState for hover
function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  return (
    <Link 
      href={`/products/${product.slug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="bg-white rounded-lg overflow-hidden transition-all duration-300"
        style={{
          boxShadow: isHovered ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
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

          <div 
            className="absolute bottom-0 left-0 right-0 bg-gray-900 text-white py-2 flex items-center justify-center gap-2 transition-transform duration-300"
            style={{
              transform: isHovered ? 'translateY(0)' : 'translateY(100%)'
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-sm font-semibold">View</span>
          </div>
        </div>

        <div className="p-3 md:p-4">
          <h3 
            className="font-semibold mb-2 line-clamp-2 transition-colors duration-300"
            style={{
              color: isHovered ? '#4b5563' : '#111827'
            }}
          >
            {product.name}
          </h3>
          
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-lg font-bold text-gray-900">
                  Rp. {product.discount_price!.toLocaleString("id-ID", { minimumFractionDigits: 0 })}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  Rp. {product.price.toLocaleString("id-ID", { minimumFractionDigits: 0 })}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                Rp. {product.price.toLocaleString("id-ID", { minimumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Category Card Component with useState for hover
function CategoryCard({ category }: { category: Category }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link
      href={`/category/${category.slug}`}
      className="block relative h-48 md:h-64 rounded-lg overflow-hidden transition-all duration-300"
      style={{
        boxShadow: isHovered ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={category.image}
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-500"
        style={{
          transform: isHovered ? 'scale(1.1)' : 'scale(1)'
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
        <h3 
          className="text-xl md:text-2xl font-bold mb-1 transition-transform duration-300"
          style={{
            transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
          }}
        >
          {category.name}
        </h3>
        <p className="text-sm text-gray-200">
          {category.product_count} {category.product_count === 1 ? 'Product' : 'Products'}
        </p>
      </div>
    </Link>
  );
}