import { useState } from "react";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import { usePage, Link, router } from "@inertiajs/react";

export default function Header() {
  const { shared } = usePage().props as any;
  const header = shared?.header;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Search handler
  const handleSearch = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (searchQuery.trim()) {
      // Navigate to search page
      router.get('/shop', { search: searchQuery.trim() });
    }
  };

  if (!header) return null;

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-10 py-3 relative">
        {/* Left Side - Mobile Menu & Search */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={() => {
              setMobileOpen(!mobileOpen);
              setSearchOpen(false);
            }}
            className="p-2 text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              setMobileOpen(false);
            }}
            className="p-2 text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Center - Logo/Shop Name */}
        <Link href="/" className="flex items-center space-x-2 lg:mr-auto">
          {header.logo ? (
            <img
              src={header.logo}
              alt="Logo"
              className="h-8 object-contain"
            />
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {header.shop_name || "Shop"}
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-8 font-semibold text-sm tracking-wide uppercase">
          {header.menus?.map((menu: any) => (
            <div
              key={menu.label}
              className="relative"
              onMouseEnter={() => setHoveredMenu(menu.label)}
              onMouseLeave={() => setHoveredMenu(null)}
            >
        
            <Link href={menu.children?.length ? "#" : menu.url} className="flex items-center gap-1 py-2 text-gray-700 hover:text-black transition" 
                onClick={(e) => menu.children?.length && e.preventDefault()}>
                 {menu.label}
                {menu.children?.length > 0 && (
                  <ChevronDown className="w-4 h-4 mt-[1px]" />
                )}
            </Link>
            
              {/* Normal Dropdown */}
              {menu.children?.length > 0 && hoveredMenu === menu.label && (
                <div
                  className="absolute left-0 pt-2 w-56"
                  style={{ top: '100%' }}
                  onMouseEnter={() => setHoveredMenu(menu.label)}
                  onMouseLeave={() => setHoveredMenu(null)}
                >
                  <div className="bg-white shadow-lg border border-gray-100 rounded-lg py-2">
                    {menu.children.map((child: any) => (
                      <div key={child.label}>
                        <Link href={child.url} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition">
                            {child.label}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right Side - Desktop Search */}
        <div className="hidden lg:flex items-center gap-4 ml-8">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <Search className="w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="bg-transparent text-sm px-3 py-1 focus:outline-none w-48 xl:w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-500 hover:text-gray-700 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Placeholder for mobile to center logo */}
        <div className="w-16 lg:hidden"></div>
      </div>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="lg:hidden px-4 pb-3 bg-white border-t border-gray-100">
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
            <Search className="w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="bg-transparent text-sm px-3 py-1 focus:outline-none w-full"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col px-4 py-4 space-y-1 font-medium">
            {header.menus?.map((menu: any) => (
              <div key={menu.label} className="border-b border-gray-100 last:border-0">
                {menu.children?.length > 0 ? (
                  <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer py-3 px-2 hover:bg-gray-50 rounded-lg list-none">
                      <span className="text-gray-900">{menu.label}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="ml-3 mt-1 space-y-1 pb-2">
                      {menu.children.map((child: any) => (
                        <div key={child.label}>
                          {child.children?.length > 0 ? (
                            <details className="group/sub">
                              <summary className="flex justify-between items-center cursor-pointer py-2 px-3 text-gray-700 hover:bg-gray-50 rounded-lg list-none">
                                <span className="text-sm">{child.label}</span>
                                <ChevronDown className="w-3 h-3 text-gray-500 group-open/sub:rotate-180 transition-transform" />
                              </summary>
                              <ul className="ml-3 mt-1 space-y-1 pb-1">
                                {child.children.map((sub: any) => (
                                  <li key={sub.label}>
                                    <a
                                      href={sub.url}
                                      className="block py-2 px-3 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg"
                                      onClick={() => setMobileOpen(false)}
                                    >
                                      {sub.label}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ) : (
                            <a
                              href={child.url}
                              className="block py-2 px-3 text-sm text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg"
                              onClick={() => setMobileOpen(false)}
                            >
                              {child.label}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : (
                    <Link href={menu.url} className="block py-3 px-2 text-gray-900 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                        {menu.label}
                    </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}