import React, { useEffect, useState } from 'react';
import { X, Package, Clock, CheckCircle2, Truck, RefreshCw, User as UserIcon } from 'lucide-react';
import type { Order, User } from '../types';
import { fetchOrders, fetchUserOrders } from '../services/api';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterMine, setFilterMine] = useState(true);

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

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (currentUser && filterMine) {
        const data = await fetchUserOrders(currentUser.id);
        setOrders(data);
      } else {
        const data = await fetchOrders();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, currentUser, filterMine]);

  if (!isOpen) return null;

  const steps = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-black/10 overflow-hidden relative max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold font-editorial text-slate-900">Your Orders & Tracking</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadOrders}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No orders placed yet</p>
              <p className="text-xs text-slate-400">Items you purchase will appear here with live tracking.</p>
            </div>
          ) : (
            orders.map((order) => {
              const currentStepIndex = steps.indexOf(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-[#FAFAF9] rounded-2xl p-5 border border-slate-200/80 space-y-4"
                >
                  {/* Top Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Order</span>
                      <h4 className="text-sm font-bold font-mono text-slate-900">#{order.order_number}</h4>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Placed on</span>
                      <p className="text-xs font-medium text-slate-700">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Total</span>
                      <p className="text-sm font-bold text-emerald-700">₹{order.total_amount}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white border border-emerald-200 text-emerald-800">
                      {order.status}
                    </span>
                  </div>

                  {/* Tracking Timeline */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">Delivery Progress:</p>
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {steps.map((st, idx) => {
                        const isDone = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <div key={st} className="space-y-1">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isDone ? 'bg-emerald-600' : 'bg-slate-200'
                              } ${isCurrent ? 'ring-2 ring-emerald-300' : ''}`}
                            />
                            <span
                              className={`text-[9px] uppercase tracking-wider font-bold block ${
                                isCurrent ? 'text-emerald-700' : isDone ? 'text-slate-700' : 'text-slate-400'
                              }`}
                            >
                              {st}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items list */}
                  {order.items && order.items.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <p className="text-[11px] font-semibold text-slate-600 mb-1.5">Ordered Items:</p>
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                            <span className="truncate max-w-xs">{item.product_name} × {item.quantity}</span>
                            <span className="font-semibold text-slate-900">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700">Ship to: </span>
                    {order.customer_name} • {order.customer_address}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
