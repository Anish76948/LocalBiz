import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon, Sparkles } from 'lucide-react';
import { createProduct } from '../services/api';
import { Product } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category_slug: 'ceramics',
    price: '',
    original_price: '',
    unit: 'piece',
    stock: '15',
    image_url: '',
    description: '',
    badge: 'Artisan Made',
  });
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateAIDescription = async () => {
    if (!formData.name) {
      setError('Please enter a product name first so the AI can describe it.');
      return;
    }
    setGeneratingAI(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Write a compelling 2-sentence artisanal product description for "${formData.name}" (category: ${formData.category_slug}). Focus on authentic Indian regional craft heritage and sustainable materials. Output only the description text.`,
        }),
      });
      const data = await res.json();
      if (data && data.reply) {
        setFormData((prev) => ({ ...prev, description: data.reply }));
      }
    } catch (err) {
      console.error('Failed to generate AI description:', err);
    } finally {
      setGeneratingAI(false);
    }
  };

  // Preset sample image shortcuts to speed up testing
  const presets = [
    {
      label: 'Terracotta Jug',
      cat: 'ceramics',
      url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Organic Spices Jar',
      cat: 'food',
      url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Handmade Wooden Tray',
      cat: 'crafts',
      url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Indigo Cotton Stole',
      cat: 'textiles',
      url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.image_url) {
      setError('Please provide product name, price, and image URL.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createProduct({
        name: formData.name,
        category_slug: formData.category_slug,
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : undefined,
        unit: formData.unit,
        stock: Number(formData.stock),
        image_url: formData.image_url,
        description: formData.description,
        badge: formData.badge,
        vendor_id: 1, // Defaulting to Priya's Studio
      });

      onProductAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-black/10 overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold font-editorial text-slate-900">Add New Artisan Product</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Handcrafted Ceramic Mug with Terracotta Glaze"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category_slug}
                onChange={(e) => setFormData({ ...formData, category_slug: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="ceramics">Ceramics & Pottery</option>
                <option value="food">Organic Food & Honey</option>
                <option value="textiles">Handloom Textiles</option>
                <option value="crafts">Wood & Brass Crafts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Highlight Badge</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                placeholder="499"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Original Price (₹)</label>
              <input
                type="number"
                placeholder="699"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit / Pack</label>
              <input
                type="text"
                placeholder="piece / 300g"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL *</label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/..."
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Presets */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Quick presets:</span>
              {presets.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => setFormData({ ...formData, image_url: p.url, category_slug: p.cat })}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-medium text-slate-700"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Artisan Craft Description</label>
              <button
                type="button"
                onClick={handleGenerateAIDescription}
                disabled={generatingAI}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin-subtle" />
                <span>{generatingAI ? 'Drafting craft story...' : '✨ AI Generate Description'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Describe the artisan craft technique, materials, care instructions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-md glow-emerald disabled:opacity-50 cursor-pointer"
          >
            {loading ? <span>Saving to SQLite...</span> : <span>Publish Product to Marketplace</span>}
          </button>
        </form>

      </div>
    </div>
  );
};
