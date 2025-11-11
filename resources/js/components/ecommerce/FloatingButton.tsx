import { useState, useRef, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";

interface FloatingWhatsAppButtonProps {
    items: {
        label: string;
        whatsapp_number?: string;
        whatsapp_message_template?: string;
        onClick?: () => void;
    }[];
}

export default function FloatingWhatsAppButton({ items }: FloatingWhatsAppButtonProps) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle WhatsApp click
    const handleWhatsAppClick = (item: {
        whatsapp_number?: string;
        whatsapp_message_template?: string;
        onClick?: () => void;
    }) => {
        // Run custom onClick if provided
        if (item.onClick) item.onClick();

        // Construct WhatsApp URL
        if (item.whatsapp_number) {
            const message =
                item.whatsapp_message_template ||
                "Hello, I would like to know more about your services.";
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${item.whatsapp_number}?text=${encodedMessage}`;

            window.open(whatsappUrl, "_blank");
        }

        setOpen(false);
    };

    return (
        <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
            {/* Dropdown menu */}
            <div
                className={`absolute bottom-16 right-0 flex flex-col items-end space-y-2 transition-all duration-200 ${
                    open
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 pointer-events-none translate-y-2"
                }`}
            >
                <div className="flex flex-col items-stretch w-48">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => handleWhatsAppClick(item)}
                            className="w-full bg-white shadow-lg px-4 py-2 rounded-lg text-gray-800 hover:bg-gray-100 transition whitespace-nowrap text-left mt-2 cursor-pointer"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Floating WhatsApp Button */}
            <button
                onClick={() => setOpen(!open)}
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all"
            >
                {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>
        </div>
    );
}
