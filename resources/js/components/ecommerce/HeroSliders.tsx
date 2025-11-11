import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Hero {
  id: number;
  title?: string;
  subtitle?: string;
  image?: string;
  button_text?: string;
  button_link?: string;
}

export default function HeroSlider({ heroes }: { heroes: Hero[] }) {
  const [current, setCurrent] = useState(0);

  // Auto-slide every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroes.length]);

  if (!heroes?.length) return null;

  return (
    <div className="relative w-full h-[60vh] overflow-hidden bg-gray-100">
      <AnimatePresence>
        {heroes.map(
          (slide, index) =>
            index === current && (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={slide.image || "/placeholder.jpg"}
                  alt={slide.title || "Banner"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
                  {slide.title && (
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
                      {slide.title}
                    </h1>
                  )}
                  {slide.subtitle && (
                    <p className="text-white/90 text-lg md:text-xl mb-6 max-w-xl">
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.button_text && (
                    <a
                      href={slide.button_link || "#"}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold transition"
                    >
                      {slide.button_text}
                    </a>
                  )}
                </div>
              </motion.div>
            )
        )}
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {heroes.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full ${
              current === i ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
