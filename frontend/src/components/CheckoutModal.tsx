import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle2,
  Tag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Sparkles,
} from 'lucide-react';
import type { CartItem, Order, User } from '../types';
import { createOrder } from '../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (order: Order) => void;
  currentUser?: User | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
  currentUser,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
    name: currentUser?.name || 'Anish',
    phone: currentUser?.phone || '9820123456',
    address: currentUser?.address || 'Flat 402, Lotus Greens, Bandra West, Mumbai 400050',
    pincode: '400050',
    paymentMethod: 'UPI (GPay/PhonePe Sandbox)',
  });

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill when currentUser changes or modal opens
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: currentUser.name || prev.name,
        phone: currentUser.phone || prev.phone,
        address: currentUser.address || prev.address,
      }));
    }
    if (isOpen) {
      setStep(1);
      setError(null);
    }
  }, [currentUser, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const delivery = subtotal > 499 ? 0 : 50;

  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.discount;
  }
  const grandTotal = Math.max(0, subtotal + delivery - discount);

  const handleApplyCoupon = () => {
    setCouponError(null);
    const code = couponInput.trim().toUpperCase();
    if (code === 'VOCAL4LOCAL') {
      const disc = Math.min(100, subtotal);
      setAppliedCoupon({ code, discount: disc });
    } else if (code === 'ARTISAN10') {
      const disc = Math.round(subtotal * 0.1);
      setAppliedCoupon({ code, discount: disc });
    } else {
      setCouponError('Invalid coupon code. Try VOCAL4LOCAL or ARTISAN10');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const handleProceedToPayment = () => {
    if (!formData.name.trim()) {
      setError('Please provide the recipient full name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      setError('Please provide a valid 10-digit phone number.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Please provide a valid delivery address.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const orderPayload = {
        customer_name: formData.name.trim(),
        customer_phone: formData.phone.trim(),
        customer_address: `${formData.address.trim()} (PIN: ${formData.pincode.trim() || '400050'})`,
        payment_method: `${formData.paymentMethod}${appliedCoupon ? ` (Promo: ${appliedCoupon.code})` : ''}`,
        total_amount: grandTotal,
        items: items.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          image_url: i.product.image_url,
        })),
      };

      const res = await createOrder(orderPayload);
      onOrderSuccess(res.order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-black/10 overflow-hidden relative animate-in zoom-in-95 duration-200 my-6">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-editorial text-slate-900">Direct Artisan Checkout</h2>
            <p className="text-xs text-slate-500">
              {currentUser ? `Checking out as ${currentUser.name}` : 'Simulated payment gateway (Sandbox mode)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zeigarnik Progress Step Indicator */}
        <div className="bg-[#FAFAF9] px-6 py-3 border-b border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {step > 1 ? '✓' : '1'}
            </span>
            <span className={`font-semibold ${step === 1 ? 'text-slate-900' : 'text-slate-500'}`}>
              Shipping Details
            </span>
          </div>

          <div className="flex-1 mx-4 h-0.5 bg-slate-200">
            <div
              className={`h-full bg-emerald-600 transition-all duration-300 ${
                step === 2 ? 'w-full' : 'w-0'
              }`}
            />
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className={`font-semibold ${step === 2 ? 'text-slate-900' : 'text-slate-500'}`}>
              Payment & Confirm
            </span>
          </div>
        </div>

        {/* Sandbox Notice Banner */}
        <div className="bg-amber-50/70 border-b border-amber-200/60 px-6 py-2 flex items-center space-x-2 text-amber-900 text-xs font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Demo Environment: Orders persist to SQLite database. No real money charged.</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}

        {/* STEP 1: SHIPPING & CONTACT */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Anish"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (10 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9820123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="400050"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Flat / Building, Street, Locality, City..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-emerald-600 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <span>Continue to Payment & Order Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT & CONFIRMATION */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Delivery Recap Pill */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <span className="font-semibold text-slate-800">{formData.name}</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-slate-600">{formData.phone}</span>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{formData.address}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-emerald-700 font-semibold hover:underline shrink-0 text-xs cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Simulated Payment Option</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI (GPay/PhonePe Sandbox)', label: 'UPI / QR', icon: Smartphone },
                  { id: 'Test Card (Stripe Sandbox)', label: 'Card', icon: CreditCard },
                  { id: 'Cash on Delivery', label: 'Cash (COD)', icon: Banknote },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = formData.paymentMethod.startsWith(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setFormData({ ...formData, paymentMethod: m.id })}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 transition text-xs font-medium cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Promo Code Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Have an Artisan Promo Code?</span>
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="font-semibold text-emerald-800">
                    🎉 Coupon '{appliedCoupon.code}' applied (-₹{appliedCoupon.discount})
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-rose-600 font-semibold hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Try VOCAL4LOCAL or ARTISAN10"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs uppercase font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>}
            </div>

            {/* Amount Summary */}
            <div className="p-4 rounded-2xl bg-[#FAFAF9] border border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Total ({items.length}):</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Direct Artisan Packaging & Dispatch:</span>
                <span>{delivery === 0 ? 'Free' : `₹${delivery}`}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount ({appliedCoupon.code}):</span>
                  <span>-₹{appliedCoupon.discount}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-base">
                <span>Final Total to Pay:</span>
                <span className="text-emerald-700">₹{grandTotal}</span>
              </div>
            </div>

            {/* Trust Badges Cluster (Loss Aversion & Trust Signals) */}
            <div className="grid grid-cols-3 gap-2 py-1 border-y border-slate-100 text-[10px] text-slate-500">
              <div className="flex items-center space-x-1.5 justify-center py-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>256-Bit SSL Encrypted</span>
              </div>
              <div className="flex items-center space-x-1.5 justify-center py-1 border-x border-slate-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>100% Verified Artisan</span>
              </div>
              <div className="flex items-center space-x-1.5 justify-center py-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Damage Guarantee</span>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-md glow-emerald disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing Simulated Order...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Place Order (₹{grandTotal})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
