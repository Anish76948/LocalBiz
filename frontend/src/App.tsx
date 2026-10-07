import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { VendorStorefrontModal } from './components/VendorStorefrontModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrdersModal } from './components/OrdersModal';
import { VendorPortal } from './components/VendorPortal';
import { AddProductModal } from './components/AddProductModal';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { AuthModal } from './components/AuthModal';
import { Toast, ToastMessage } from './components/Toast';
import type { Product, CartItem, Order, User } from './types';
import { fetchProducts } from './services/api';
import { Sparkles, SlidersHorizontal, ArrowUpRight, ArrowUpDown, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('localbiz_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Wishlist State
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('localbiz_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals and Drawers
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('localbiz_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [isVendorMode, setIsVendorMode] = useState(false);
  const [isWishlistOnly, setIsWishlistOnly] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const productsRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('localbiz_cart', JSON.stringify(cart));
  }, [cart]);

  // Load products from SQLite backend with sorting & filters
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProducts(activeCategory, searchTerm, sortBy);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products from API:', err);
      addToast('error', 'Unable to fetch products. Check backend server.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchTerm, sortBy, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });

    setRecentlyAddedId(product.id);
    addToast('success', `Added to Basket: ${product.name}`);
    setTimeout(() => setRecentlyAddedId(null), 1500);
  };

  const handleUpdateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    addToast('info', 'Item removed from basket');
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setIsCheckoutOpen(true);
  };

  const handleToggleFavorite = (product: Product) => {
    setWishlist((prev) => {
      const isFav = prev.includes(product.id);
      const next = isFav ? prev.filter((id) => id !== product.id) : [...prev, product.id];
      localStorage.setItem('localbiz_wishlist', JSON.stringify(next));
      addToast(isFav ? 'info' : 'success', isFav ? 'Removed from wishlist' : `Saved ${product.name} to Wishlist ❤️`);
      return next;
    });
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('localbiz_user', JSON.stringify(user));
    addToast('success', `Welcome back, ${user.name}!`);
    if (user.role === 'artisan') {
      setIsVendorMode(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('localbiz_user');
    setIsVendorMode(false);
    addToast('info', 'Signed out successfully.');
  };

  const handleOrderSuccess = (order: Order) => {
    setCart([]);
    setLatestOrder(order);
    addToast('success', `Order placed successfully! (${order.order_number})`);
  };

  const handleGoHome = () => {
    setIsVendorMode(false);
    setSelectedProduct(null);
    setSelectedVendorId(null);
    setSearchTerm('');
    setActiveCategory('all');
    setSortBy('featured');
    setIsWishlistOnly(false);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setIsOrdersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1E293B] flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Top Sticky Header */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        isVendorMode={isVendorMode}
        onToggleVendorMode={() => setIsVendorMode(!isVendorMode)}
        onScrollToProducts={() => productsRef.current?.scrollIntoView({ behavior: 'smooth' })}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        wishlistCount={wishlist.length}
        isWishlistActive={isWishlistOnly}
        onToggleWishlist={() => {
          setIsWishlistOnly((prev) => !prev);
          productsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {isVendorMode ? (
          /* Vendor Management Workspace */
          <VendorPortal
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onRefreshMarketplace={loadProducts}
          />
        ) : (
          /* Public Marketplace Customer View */
          <>
            {/* Hero Section matching the user's design image */}
            <Hero
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              onExplore={() => productsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              onSelectVendor={(vId) => setSelectedVendorId(vId)}
            />

            {/* Products Bento Section */}
            <section ref={productsRef} className="pt-8 pb-20 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Curated Marketplace</span>
                  </div>
                  <h2 className="text-3xl font-bold font-editorial text-slate-900">
                    Artisan Catalog & Direct Orders
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Sorting dropdown */}
                  <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 font-medium">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="featured">Featured Creations</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                    <span>{isWishlistOnly ? products.filter((p) => wishlist.includes(p.id)).length : products.length} creations</span>
                  </div>
                </div>
              </div>

              {/* Wishlist Active Notification Banner */}
              {isWishlistOnly && (
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-center justify-between text-xs sm:text-sm animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2 text-rose-900 font-semibold">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                    <span>Viewing Your Saved Creations ({products.filter((p) => wishlist.includes(p.id)).length} items)</span>
                  </div>
                  <button
                    onClick={() => setIsWishlistOnly(false)}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                  >
                    Show Full Marketplace Catalog
                  </button>
                </div>
              )}

              {/* Product Grid */}
              {loading && products.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Fetching products from SQLite database...</p>
                </div>
              ) : (isWishlistOnly ? products.filter((p) => wishlist.includes(p.id)) : products).length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                  <p className="text-base font-semibold text-slate-800">
                    {isWishlistOnly ? 'Your Wishlist is Empty' : 'No matching creations found'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isWishlistOnly
                      ? 'Tap the heart icon on any craft in the catalog to save your favorite creations here!'
                      : 'Try searching for pottery, raw honey, mango pickle, or clear the category filters.'}
                  </p>
                  <button
                    onClick={() => {
                      if (isWishlistOnly) {
                        setIsWishlistOnly(false);
                      } else {
                        setSearchTerm('');
                        setActiveCategory('all');
                        setSortBy('featured');
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-emerald-600 transition cursor-pointer"
                  >
                    {isWishlistOnly ? 'Explore All Creations' : 'Reset Filters'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(isWishlistOnly ? products.filter((p) => wishlist.includes(p.id)) : products).map((p) => {
                    const cartItem = cart.find((i) => i.product.id === p.id);
                    return (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onAddToCart={(prod) => handleAddToCart(prod, 1)}
                        onSelectProduct={(prod) => setSelectedProduct(prod)}
                        onSelectVendor={(vId) => setSelectedVendorId(vId)}
                        isAdded={recentlyAddedId === p.id}
                        isFavorite={wishlist.includes(p.id)}
                        onToggleFavorite={handleToggleFavorite}
                        cartQuantity={cartItem ? cartItem.quantity : 0}
                        onUpdateQty={handleUpdateQty}
                      />
                    );
                  })}
                </div>
              )}

              {/* Mission / Value Prop Banner */}
              <div className="mt-14 p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-2 max-w-xl z-10">
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    Grassroots Commerce
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl font-bold">
                    Empowering 500+ Indian Artisans & Food Makers
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    LocalBiz cuts out middleman commissions, returning up to 88% of retail value directly to rural craftspeople and micro-entrepreneurs.
                  </p>
                </div>

                <button
                  onClick={() => setIsVendorMode(true)}
                  className="px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center space-x-2 shrink-0 z-10 shadow-lg cursor-pointer"
                >
                  <span>Open Artisan Shop</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

            </section>
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-10 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-500">
            <span className="font-editorial font-bold text-base text-slate-900">LocalBiz</span>
            <span>•</span>
            <span>Authentic Indian Artisan Marketplace</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} All rights reserved</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-600">
            <button onClick={() => setIsVendorMode(!isVendorMode)} className="hover:text-emerald-700 font-medium cursor-pointer">
              {isVendorMode ? 'Switch to Customer View' : 'Vendor Portal'}
            </button>
            <button onClick={() => setIsOrdersOpen(true)} className="hover:text-emerald-700 font-medium cursor-pointer">
              Track Orders
            </button>
            <span>SQLite Database Active</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onOpenVendor={(vId) => {
          setSelectedProduct(null);
          setSelectedVendorId(vId);
        }}
        onReviewSubmitted={() => {
          loadProducts();
          addToast('success', 'Verified review recorded! Thank you for supporting local artisans.');
        }}
      />

      <VendorStorefrontModal
        vendorId={selectedVendorId}
        onClose={() => setSelectedVendorId(null)}
        onSelectProduct={(p) => {
          setSelectedVendorId(null);
          setSelectedProduct(p);
        }}
        onAddToCart={(p) => handleAddToCart(p, 1)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        onOrderSuccess={handleOrderSuccess}
        currentUser={currentUser}
      />

      <OrderSuccessModal
        order={latestOrder}
        onClose={() => setLatestOrder(null)}
        onViewOrders={() => setIsOrdersOpen(true)}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        currentUser={currentUser}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onProductAdded={() => {
          loadProducts();
          addToast('success', 'New artisan creation listed successfully!');
        }}
      />

      {/* Floating AI Assistant (Bazaar Buddy) */}
      <AIAssistantWidget
        onActionSuccess={() => {
          loadProducts();
          addToast('info', 'Marketplace updated via AI Assistant.');
        }}
        onOpenOrders={() => setIsOrdersOpen(true)}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

    </div>
  );
};
