import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { ShoppingBag, Search, User, Menu, X, Shield, Truck, Phone, MapPin, Mail } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

export function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const location = useLocation();

  const navLinks = [
    { label: 'Storefront', path: '/' },
    { label: 'Shop Catalog', path: '/shop' },
    { label: 'Track Shipment', path: '/orders' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Top Notification Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>R2 Express — Ethiopian Shipping Center & Mini ERP Hub</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1"><Truck size={13} className="text-sky-400" /> Nationwide Shipping across Ethiopia</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:flex items-center gap-1"><Phone size={13} /> +251 91 123 4567</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">
                R2
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  R2 EXPRESS
                </span>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mt-0.5">
                  Shipping & Mini ERP
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-semibold transition-colors ${
                    location.pathname === link.path
                      ? 'text-sky-600 border-b-2 border-sky-600 pb-1'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/shop"
                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                title="Search Products"
              >
                <Search size={20} />
              </Link>

              <Link
                to="/auth"
                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                title="Customer Account"
              >
                <User size={20} />
              </Link>

              <Link
                to="/cart"
                className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                title="Shopping Cart"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>

              <button
                className="md:hidden p-2 text-slate-600 rounded-lg hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
                  R2
                </div>
                <span className="text-lg font-black text-white tracking-tight">R2 EXPRESS</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Web-based mini ERP & shipping management center for Ethiopian commerce. Streamlining inventory, order fulfillment, and multi-store operations.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-sky-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Active Hub: Addis Ababa & Adama Centers</span>
              </div>
            </div>

            <div>
              <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Online Storefront</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to="/shop" search={{ category: 'rtw' } as any} className="hover:text-white transition-colors">Ready-to-Wear</Link></li>
                <li><Link to="/shop" search={{ category: 'traditional' } as any} className="hover:text-white transition-colors">Traditional & Kemis</Link></li>
                <li><Link to="/shop" search={{ category: 'outerwear' } as any} className="hover:text-white transition-colors">Outerwear & Jackets</Link></li>
                <li><Link to="/shop" search={{ category: 'accessories' } as any} className="hover:text-white transition-colors">Accessories & Footwear</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Customer Support</h3>
              <ul className="space-y-2 text-xs">
                <li><Link to="/orders" className="hover:text-white transition-colors">Track Your Order</Link></li>
                <li><Link to="/cart" className="hover:text-white transition-colors">View Cart & Checkout</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Customer Login / Register</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy & Terms</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Shipping Center & Staff</h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <MapPin size={14} className="text-sky-400 shrink-0 mt-0.5" />
                  <span>Bole Sub-city & Adama Logistics Branch, Ethiopia</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-sky-400 shrink-0" />
                  <span>support@r2express.et</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-sky-400 shrink-0" />
                  <span>+251 91 123 4567 / +251 22 111 8899</span>
                </li>
                <li className="pt-2">
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 rounded text-xs font-bold transition-colors"
                  >
                    <Shield size={13} />
                    <span>Internal Staff / Admin Portal</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>&copy; 2026 R2 Express. Ethiopian Shipping Center & Mini ERP System. All rights reserved.</p>
            <div className="flex items-center gap-4 text-slate-500">
              <span>Telebirr</span>
              <span>•</span>
              <span>CBE Birr</span>
              <span>•</span>
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
