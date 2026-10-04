import React, { useEffect, useState } from 'react';
import { Plus, Package, IndianRupee, ShoppingBag, Trash2, CheckCircle2, Clock, Truck, RefreshCw } from 'lucide-react';
import { Product, Order, DashboardStats } from '../types';
import { fetchStats, fetchOrders, fetchProducts, updateOrderStatus, deleteProduct } from '../services/api';

interface VendorPortalProps {
  onOpenAddProduct: () => void;
  onRefreshMarketplace: () => void;
}

export const VendorPortal: React.FC<VendorPortalProps> = ({
  onOpenAddProduct,
  onRefreshMarketplace,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      const [s, o, p] = await Promise.all([fetchStats(), fetchOrders(), fetchProducts()]);
      setStats(s);
      setOrders(o);
      setProducts(p);
    } catch (err) {
      console.error('Failed to load vendor data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      await loadVendorData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this product from the marketplace?')) return;
    try {
      await deleteProduct(id);
      await loadVendorData();
      onRefreshMarketplace();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-black/[0.06] shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Artisan Studio Workspace</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-slate-900">Vendor Management Dashboard</h2>
          <p className="text-xs text-slate-500">Live operational oversight powered by SQLite database</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadVendorData}
            className="p-3 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenAddProduct}
            className="px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition flex items-center space-x-2 shadow-md glow-emerald cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-black/[0.05] shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Sales</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              ₹{stats ? stats.totalRevenue : 0}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/[0.05] shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Orders Placed</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              {stats ? stats.totalOrders : 0}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/[0.05] shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Products</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              {stats ? stats.totalProducts : 0}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/[0.05] shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Artisan Shops</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              {stats ? stats.totalVendors : 0}
            </h3>
          </div>
        </div>

      </div>

      {/* Orders Fulfillment Management */}
      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-editorial text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500">Progress order states directly in SQLite</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {orders.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF9] text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-6">Order ID</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Items</th>
                <th className="py-3.5 px-6">Total</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Fulfillment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No orders in database. Place a test order from the marketplace!
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">#{o.order_number}</td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">{o.customer_name}</p>
                      <p className="text-[11px] text-slate-400">{o.customer_phone}</p>
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate">
                      {o.items?.map((i) => `${i.product_name} (${i.quantity})`).join(', ') || 'N/A'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">₹{o.total_amount}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.status === 'SHIPPED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {o.status === 'PLACED' && (
                        <button
                          onClick={() => handleStatusChange(o.id, 'SHIPPED')}
                          className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-semibold transition"
                        >
                          Mark Shipped
                        </button>
                      )}
                      {o.status === 'SHIPPED' && (
                        <button
                          onClick={() => handleStatusChange(o.id, 'DELIVERED')}
                          className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {o.status === 'DELIVERED' && (
                        <span className="text-emerald-600 font-semibold text-[11px]">Completed ✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Management Table */}
      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-editorial text-slate-900">Active Product Inventory</h3>
            <p className="text-xs text-slate-500">Manage catalog and stock in SQLite</p>
          </div>
          <button
            onClick={onOpenAddProduct}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            + Quick Add
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF9] text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-6">Product</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Price</th>
                <th className="py-3.5 px-6">Stock</th>
                <th className="py-3.5 px-6">Rating</th>
                <th className="py-3.5 px-6 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-6 flex items-center space-x-3">
                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 max-w-xs truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.vendor_name}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 uppercase tracking-wider text-[10px] font-semibold text-slate-500">
                    {p.category_slug}
                  </td>
                  <td className="py-3.5 px-6 font-bold text-slate-900">₹{p.price}</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-700">{p.stock}</td>
                  <td className="py-3.5 px-6">★ {p.rating}</td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
