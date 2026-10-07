import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Package, Store, Sparkles, User as UserIcon, LogOut, ChevronDown, Heart } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  isVendorMode: boolean;
  onToggleVendorMode: () => void;
  onScrollToProducts: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  wishlistCount?: number;
  isWishlistActive?: boolean;
  onToggleWishlist?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenOrders,
  isVendorMode,
  onToggleVendorMode,
  onScrollToProducts,
  currentUser,
  onOpenAuth,
  onLogout,
  onGoHome,
  wishlistCount = 0,
  isWishlistActive = false,
  onToggleWishlist,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF9]/90 backdrop-blur-md border-b border-black/[0.05] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand */}
        <button
          type="button"
          className="flex items-center space-x-3 cursor-pointer select-none text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl p-1 -m-1"
          onClick={onGoHome}
          title="Go to LocalBiz Home"
          aria-label="LocalBiz Home"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm glow-emerald shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-2xl font-bold font-editorial tracking-tight text-slate-900">LocalBiz</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] tracking-wider uppercase text-slate-500 font-medium">Artisan Marketplace</p>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <button onClick={onGoHome} className="hover:text-emerald-700 transition font-medium">
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
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          
          {/* Vendor Mode Toggle */}
          <button
            onClick={onToggleVendorMode}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition flex items-center space-x-2 border ${
              isVendorMode
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-700'
            }`}
            title="Switch between Customer View and Vendor Portal"
          >
            <Store className="w-4 h-4" />
            <span>{isVendorMode ? 'Exit Vendor View' : 'Vendor Portal'}</span>
          </button>

          {/* Wishlist Button */}
          {onToggleWishlist && (
            <button
              onClick={onToggleWishlist}
              className={`relative p-2.5 rounded-full border transition shadow-xs ${
                isWishlistActive
                  ? 'bg-rose-50 border-rose-300 text-rose-600 ring-2 ring-rose-200'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600'
              }`}
              aria-label="Wishlist"
              title={isWishlistActive ? 'Show All Products' : 'View Saved Wishlist'}
            >
              <Heart className={`w-5 h-5 ${isWishlistActive || wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-scale">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

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

          {/* User Sign in badge or User Profile Pill */}
          {currentUser ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className={`flex items-center space-x-2 pl-1.5 pr-2.5 py-1.5 rounded-full bg-white border transition shadow-xs text-xs font-semibold text-slate-800 focus:outline-none ${
                  isProfileMenuOpen ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-emerald-500'
                }`}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-emerald-500/30"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="max-w-[80px] sm:max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180 text-emerald-600' : ''}`} />
              </button>

              {/* Profile Dropdown with invisible hit bridge to avoid mouseleave bugs */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full pt-1.5 w-56 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-100 py-2 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                      <p className="font-semibold text-slate-900 text-xs truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {currentUser.role === 'artisan' ? 'Verified Artisan' : 'Conscious Buyer'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenOrders();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center space-x-2.5 transition cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">My Orders</span>
                    </button>

                    {currentUser.role === 'artisan' && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleVendorMode();
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center space-x-2.5 transition cursor-pointer"
                      >
                        <Store className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium">Artisan Studio Portal</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium transition shadow-xs glow-emerald cursor-pointer"
            >
              Sign in now
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
