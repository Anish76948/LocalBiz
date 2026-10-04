import React from 'react';
import { ShoppingBag, Package, Store, Sparkles } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  isVendorMode: boolean;
  onToggleVendorMode: () => void;
  onScrollToProducts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenOrders,
  isVendorMode,
  onToggleVendorMode,
  onScrollToProducts,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF9]/90 backdrop-blur-md border-b border-black/[0.05] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm glow-emerald">
            <Sparkles className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-2xl font-bold font-editorial tracking-tight text-slate-900">LocalBiz</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] tracking-wider uppercase text-slate-500 font-medium">Artisan Marketplace</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-emerald-700 transition">
            Home
          </button>
          <button onClick={onScrollToProducts} className="hover:text-emerald-700 transition">
            Marketplace
          </button>
          <button onClick={onOpenOrders} className="hover:text-emerald-700 transition flex items-center space-x-1.5">
            <Package className="w-4 h-4 text-slate-400" />
            <span>Track Orders</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Vendor Mode Toggle */}
          <button
            onClick={onToggleVendorMode}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition flex items-center space-x-2 border ${
              isVendorMode
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-700'
            }`}
            title="Switch between Customer View and Vendor Portal"
          >
            <Store className="w-4 h-4" />
            <span>{isVendorMode ? 'Exit Vendor View' : 'Vendor Portal'}</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative p-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-700 transition shadow-xs"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-scale">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Sign in badge */}
          <button
            onClick={onScrollToProducts}
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium transition shadow-xs glow-emerald"
          >
            Sign in now
          </button>

        </div>
      </div>
    </header>
  );
};
