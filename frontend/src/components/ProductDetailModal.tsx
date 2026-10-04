import React, { useState } from 'react';
import { X, Star, ShieldCheck, Truck, RefreshCw, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [qty, setQty] = useState(1);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-black/10 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-600 flex items-center justify-center shadow-xs transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Image */}
          <div className="relative aspect-square md:aspect-auto bg-slate-100">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-slate-800 shadow-xs">
                {product.badge}
              </span>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              
              {/* Vendor & Rating */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-700 tracking-wide uppercase">
                  {product.vendor_name || 'Artisan Direct'}
                </span>
                <div className="flex items-center space-x-1 text-slate-700">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{product.rating}</span>
                  <span className="text-slate-400">({product.reviews_count} reviews)</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold font-editorial text-slate-900 leading-tight">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-slate-900">₹{product.price}</span>
                {product.original_price && (
                  <span className="text-sm text-slate-400 line-through">₹{product.original_price}</span>
                )}
                <span className="text-xs text-slate-500">/ {product.unit || 'unit'}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.description ||
                  'Carefully hand-crafted by skilled local artisans using regional techniques and sustainable native materials.'}
              </p>

              {/* Craftsmanship Guarantees */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-[11px] text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Genuine</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fast Dispatch</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Safe Returns</span>
                </div>
              </div>

            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              
              <div className="flex items-center space-x-4">
                <span className="text-xs font-semibold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 px-3 py-1 space-x-3">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="text-slate-600 hover:text-slate-900 font-bold px-1"
                  >
                    -
                  </button>
                  <span className="text-sm font-semibold text-slate-800">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="text-slate-600 hover:text-slate-900 font-bold px-1"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400">({product.stock} available)</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    onAddToCart(product, qty);
                    onClose();
                  }}
                  className="w-full py-3 rounded-full border border-slate-900 text-slate-900 hover:bg-slate-50 text-sm font-semibold transition flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => {
                    onBuyNow(product, qty);
                    onClose();
                  }}
                  className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shadow-md glow-emerald"
                >
                  Buy Now
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
