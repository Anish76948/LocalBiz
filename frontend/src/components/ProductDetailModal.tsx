import React, { useState, useEffect } from 'react';
import { X, Star, ShieldCheck, Truck, RefreshCw, ShoppingBag, Store, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import type { Product, Review } from '../types';
import { fetchProductReviews, createReview } from '../services/api';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onOpenVendor?: (vendorId: number) => void;
  onReviewSubmitted?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  onOpenVendor,
  onReviewSubmitted,
}) => {
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Review Form State
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Load reviews when product opens
  useEffect(() => {
    if (!product) {
      setReviews([]);
      setActiveTab('details');
      setQty(1);
      return;
    }

    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const revs = await fetchProductReviews(product.id);
        setReviews(revs);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    loadReviews();
  }, [product]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (product) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) {
      setReviewError('Please provide your name and feedback.');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      await createReview({
        product_id: product.id,
        customer_name: reviewerName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewSuccess(true);
      setReviewerName('');
      setReviewComment('');
      setReviewRating(5);

      // Refresh reviews list
      const updatedRevs = await fetchProductReviews(product.id);
      setReviews(updatedRevs);

      onReviewSubmitted?.();
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-black/10 overflow-hidden relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-md transition"
          aria-label="Close product details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-y-auto">
          {/* Image & Artisan Spotlight */}
          <div className="relative bg-slate-50 flex flex-col">
            <div className="relative aspect-square md:h-full bg-slate-100 overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-slate-800 shadow-xs border border-black/5">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {/* Details & Tabs */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Vendor & Rating Header */}
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => onOpenVendor?.(product.vendor_id)}
                  className="group flex items-center space-x-1.5 font-semibold text-emerald-700 hover:text-emerald-900 transition"
                  title="View full artisan studio"
                >
                  <Store className="w-3.5 h-3.5 group-hover:scale-110 transition" />
                  <span className="tracking-wide uppercase underline decoration-emerald-300 underline-offset-2">
                    {product.vendor_name || 'Artisan Direct'}
                  </span>
                </button>

                <div className="flex items-center space-x-1 text-slate-700">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{product.rating}</span>
                  <span className="text-slate-400">({reviews.length || product.reviews_count} reviews)</span>
                </div>
              </div>

              {/* Title & Price */}
              <div>
                <h2 className="text-2xl font-bold font-editorial text-slate-900 leading-tight">
                  {product.name}
                </h2>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-3xl font-bold text-slate-900">₹{product.price}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-sm text-slate-400 line-through">₹{product.original_price}</span>
                  )}
                  <span className="text-xs text-slate-500">/ {product.unit || 'unit'}</span>
                </div>
              </div>

              {/* Tabs: Details vs Reviews */}
              <div className="flex items-center space-x-4 border-b border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 transition border-b-2 ${
                    activeTab === 'details'
                      ? 'border-emerald-600 text-emerald-800'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Product Details
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-2 transition border-b-2 flex items-center space-x-1 ${
                    activeTab === 'reviews'
                      ? 'border-emerald-600 text-emerald-800'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Customer Reviews ({reviews.length})</span>
                </button>
              </div>

              {/* Tab 1: Details */}
              {activeTab === 'details' ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {product.description ||
                      'Carefully hand-crafted by skilled local artisans using regional techniques and sustainable native materials.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>100% Genuine</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Direct Dispatch</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Fair Trade</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Reviews & Write Form */
                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {/* Reviews List */}
                  {loadingReviews ? (
                    <div className="text-center py-4 text-xs text-slate-400">Loading verified reviews...</div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
                      No reviews yet. Be the first to share your experience!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">{rev.customer_name}</span>
                            <div className="flex items-center space-x-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < rev.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-slate-200 text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-normal">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Write a Review Section */}
                  <form onSubmit={handleSubmitReview} className="pt-3 border-t border-slate-100 space-y-2.5">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Write a Testimonial
                    </p>

                    {reviewSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Thank you! Your verified review has been recorded.</span>
                      </div>
                    )}

                    {reviewError && (
                      <div className="p-2 rounded-xl bg-rose-50 text-rose-700 text-xs">
                        {reviewError}
                      </div>
                    )}

                    {/* Star selection */}
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-500 mr-2">Your Rating:</span>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewRating(s)}
                          className="p-0.5 text-slate-300 hover:text-amber-400 transition"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              s <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-200 text-slate-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Your Full Name (e.g., Rohit Sharma)"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                      required
                    />

                    <textarea
                      placeholder="Share your experience with this artisan creation..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={2}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                      required
                    />

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{submittingReview ? 'Submitting...' : 'Post Verified Review'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-4">
                <span className="text-xs font-semibold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 px-3 py-1 space-x-3">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="text-slate-600 hover:text-slate-900 font-bold px-1"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="text-sm font-semibold text-slate-800">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="text-slate-600 hover:text-slate-900 font-bold px-1"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400">({product.stock} available in stock)</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => {
                    onAddToCart(product, qty);
                    onClose();
                  }}
                  className="w-full py-3 rounded-full border border-slate-900 text-slate-900 hover:bg-slate-50 text-sm font-semibold transition flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Basket</span>
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
