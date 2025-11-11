import { usePage } from "@inertiajs/react";
import FloatingWhatsAppButton from "@/components/ecommerce/FloatingButton";

export default function Footer() {
  const { shared } = usePage().props as any;
  const footer = shared?.footer;

  if (!footer) return null;

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300 py-12 mt-12">
        <FloatingWhatsAppButton items={footer.contacts}/>
      <div className="px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand Info */}
        <div>
          <h3 className="text-white font-semibold mb-3 text-lg">{footer.name}</h3>
          <p className="text-sm text-gray-400">{footer.description}</p>
        </div>

        {/* Dynamic Quick Links */}
        {footer.links && footer.links.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3 text-lg">Quick Links</h3>
            <ul className="space-y-1 text-sm">
              {footer.links.map((link: any) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    className="hover:text-white transition"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Optional Social Links (if available in footer config) */}
        {footer.socials && footer.socials.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3 text-lg">Stay Connected</h3>
            <p className="text-sm text-gray-400 mb-2">Follow us on social media</p>
            <div className="flex gap-3 text-white">
              {footer.socials.map((social: any) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer hover:text-blue-400 transition"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="text-center mt-8 text-xs text-gray-500 border-t border-gray-700 pt-4">
        © {new Date().getFullYear()} {footer.name}. All rights reserved.
      </div>
    </footer>
  );
}
