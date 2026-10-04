import React, { useEffect, useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrdersModal } from './components/OrdersModal';
import { VendorPortal } from './components/VendorPortal';
import { AddProductModal } from './components/AddProductModal';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import type { Product, CartItem, Order } from './types';
import { fetchProducts } from './services/api';
import { Sparkles, SlidersHorizontal, ArrowUpRight } from 'lucide-react';

export const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

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
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [isVendorMode, setIsVendorMode] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);

  const productsRef = useRef<HTMLDivElement>(null);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('localbiz_cart', JSON.stringify(cart));
  }, [cart]);

  // Load products from SQLite backend
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts(activeCategory, searchTerm);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [activeCategory, searchTerm]);

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
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    setCart([]);
    setLatestOrder(order);
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

                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <span>Showing {products.length} verified products</span>
                </div>
              </div>

              {/* Product Grid */}
              {loading && products.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Fetching products from SQLite database...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                  <p className="text-base font-semibold text-slate-800">No matching creations found</p>
                  <p className="text-xs text-slate-500">
                    Try searching for pottery, raw honey, mango pickle, or clear the category filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setActiveCategory('all');
                    }}
                    className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-emerald-600 transition"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={(prod) => handleAddToCart(prod, 1)}
                      onSelectProduct={(prod) => setSelectedProduct(prod)}
                      isAdded={recentlyAddedId === p.id}
                    />
                  ))}
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
          <div className="flex items-center space-x-2">
            <span className="font-editorial font-bold text-base text-slate-900">LocalBiz</span>
            <span>• Group 06 (Shoaib Khan & Aditi Khandge)</span>
            <span>• TCET Mumbai</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-600">
            <button onClick={() => setIsVendorMode(!isVendorMode)} className="hover:text-emerald-700 font-medium">
              {isVendorMode ? 'Switch to Customer View' : 'Vendor Portal'}
            </button>
            <button onClick={() => setIsOrdersOpen(true)} className="hover:text-emerald-700 font-medium">
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
      />

      <OrderSuccessModal
        order={latestOrder}
        onClose={() => setLatestOrder(null)}
        onViewOrders={() => setIsOrdersOpen(true)}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onProductAdded={loadProducts}
      />

      {/* Floating AI Assistant (Bazaar Buddy) */}
      <AIAssistantWidget
        onActionSuccess={loadProducts}
        onOpenOrders={() => setIsOrdersOpen(true)}
      />

    </div>
  );
};
