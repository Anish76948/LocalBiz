import React from 'react';
import { Star, Plus, Minus, Check, Heart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onSelectVendor?: (vendorId: number) => void;
  isAdded?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
  cartQuantity?: number;
  onUpdateQty?: (productId: number, delta: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onSelectProduct,
  onSelectVendor,
  isAdded = false,
  isFavorite = false,
  onToggleFavorite,
  cartQuantity = 0,
  onUpdateQty,
}) => {
  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-3xl p-4 border border-black/[0.05] hover:border-black/10 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Product Image Container */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 mb-3.5">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {product.badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/95 text-slate-800 shadow-xs border border-black/[0.04]">
                {product.badge}
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(product);
            }}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-xs hover:bg-white text-slate-400 hover:text-rose-500 transition z-10"
            aria-label={isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Rating */}
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[11px] flex items-center space-x-1 font-medium">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{product.rating}</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectVendor?.(product.vendor_id);
            }}
            className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 hover:text-emerald-900 transition hover:underline block text-left"
          >
            {product.vendor_name || 'Verified Artisan'}
          </button>
          <h3 className="font-editorial text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-800 transition">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description || 'Authentic handmade creation crafted with sustainable materials.'}
          </p>
        </div>
      </div>

      {/* Pricing & Add to Cart */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-bold text-slate-900">₹{product.price}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-slate-400 line-through">₹{product.original_price}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">per {product.unit || 'unit'}</span>
        </div>

        {cartQuantity > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center space-x-2 bg-emerald-50 border border-emerald-300 rounded-full px-2 py-1 shadow-xs"
          >
            <button
              type="button"
              onClick={() => onUpdateQty?.(product.id, -1)}
              className="w-6 h-6 rounded-full bg-white text-emerald-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition shadow-xs cursor-pointer"
              title="Decrease quantity"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold text-emerald-900 min-w-[16px] text-center">
              {cartQuantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQty?.(product.id, 1)}
              className="w-6 h-6 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center transition shadow-xs cursor-pointer"
              title="Increase quantity"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              isAdded
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-900 hover:bg-emerald-600 text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
