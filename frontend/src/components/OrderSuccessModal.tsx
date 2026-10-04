import React from 'react';
import { Check, Package, ArrowRight } from 'lucide-react';
import { Order } from '../types';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onViewOrders: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onViewOrders,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-black/10 animate-in zoom-in-95 duration-200">
        
        {/* Animated Checkmark Circle */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm glow-emerald">
          <Check className="w-8 h-8 stroke-[2.5]" />
        </div>

        <h3 className="font-editorial text-2xl font-bold text-slate-900 mb-1">
          Order Successfully Placed!
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Thank you for supporting authentic neighborhood artisans.
        </p>

        {/* Order Details Card */}
        <div className="bg-[#FAFAF9] rounded-2xl p-4 border border-slate-100 text-left space-y-3 mb-6">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Order Reference:</span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              #{order.order_number}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Amount Paid (Test):</span>
            <span className="font-bold text-emerald-700">₹{order.total_amount}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Order Status:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {order.status}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              onViewOrders();
            }}
            className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-md glow-emerald cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Track in My Orders</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
};
