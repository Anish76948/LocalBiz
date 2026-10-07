import React, { useEffect, useState } from 'react';
import { X, Star, MapPin, ShieldCheck, Heart, Sparkles, ShoppingBag, ArrowLeft } from 'lucide-react';
import type { Vendor, Product } from '../types';
import { fetchVendorById } from '../services/api';

interface VendorStorefrontModalProps {
  vendorId: number | null;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const VendorStorefrontModal: React.FC<VendorStorefrontModalProps> = ({
  vendorId,
  onClose,
  onSelectProduct,
  onAddToCart,
}) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setVendor(null);
      setProducts([]);
      return;
    }

    const loadVendorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVendorById(vendorId);
        setVendor(data.vendor);
        setProducts(data.products);
      } catch (err) {
        console.error('Failed to load vendor profile:', err);
        setError('Could not load artisan studio details.');
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [vendorId]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (vendorId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [vendorId, onClose]);

  if (!vendorId) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-black/10 overflow-hidden relative my-6 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Hero Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shrink-0">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition"
            aria-label="Close artisan profile"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Back button */}
          <button
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 text-xs text-emerald-300 hover:text-white mb-4 transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </button>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-300">Loading artisan profile...</div>
          ) : vendor ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
              <img
                src={vendor.avatar}
                alt={vendor.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400/50 shadow-xl"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{vendor.badge || 'Verified Artisan'}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-slate-200">
                    {vendor.speciality}
                  </span>
                </div>

                <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight">
                  {vendor.name}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <div className="flex items-center space-x-1 text-emerald-300">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{vendor.location}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="font-bold text-white">{vendor.rating}</span>
                    <span className="text-slate-400">({vendor.reviews_count} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-sm text-rose-300">{error || 'Artisan not found.'}</div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
          {vendor && (
            <>
              {/* Studio Story & Guarantees */}
              <div className="bg-[#FAFAF9] rounded-2xl p-5 border border-slate-200/70 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>About the Craft Studio</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {vendor.bio}
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-600 border-t border-slate-200/50">
                  <span className="flex items-center space-x-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>Direct Artisan Income: 88%</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Authenticity Guaranteed</span>
                  </span>
                </div>
              </div>

              {/* Vendor's Catalog */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-editorial text-xl font-bold text-slate-900">
                    Handmade Collection ({products.length})
                  </h3>
                  <span className="text-xs text-slate-500">Shipped directly from {vendor.location}</span>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500 bg-slate-50 rounded-2xl">
                    No active listings right now.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => onSelectProduct(p)}
                        className="group bg-white rounded-2xl p-3.5 border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              loading="lazy"
                            />
                            {p.badge && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 text-slate-800 shadow-xs">
                                {p.badge}
                              </span>
                            )}
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-[10px] flex items-center space-x-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{p.rating}</span>
                            </div>
                          </div>

                          <h4 className="font-medium text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition">
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {p.description || 'Handcrafted authentic artisan piece.'}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold text-slate-900">₹{p.price}</span>
                            <span className="text-[10px] text-slate-400 ml-1">/{p.unit || 'unit'}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(p);
                            }}
                            className="p-2 rounded-full bg-slate-900 hover:bg-emerald-600 text-white transition shadow-xs"
                            title="Add to Basket"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
