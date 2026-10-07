import React from 'react';
import { Search, Star, Sparkles, ArrowRight, ShieldCheck, X } from 'lucide-react';

interface HeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  onExplore: () => void;
  onSelectVendor?: (vendorId: number) => void;
}

export const Hero: React.FC<HeroProps> = ({
  searchTerm,
  onSearchChange,
  activeCategory,
  onSelectCategory,
  onExplore,
  onSelectVendor,
}) => {
  const categories = [
    { label: 'All Items', slug: 'all' },
    { label: 'Ceramics', slug: 'ceramics' },
    { label: 'Food & Honey', slug: 'food' },
    { label: 'Handloom Textiles', slug: 'textiles' },
    { label: 'Wood & Brass', slug: 'crafts' },
  ];

  return (
    <section className="relative pt-6 pb-14 sm:pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Subtle Ambient Glow behind Hero */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Search Pill, Action */}
          <div className="lg:col-span-7 space-y-7">
            
            {/* Tagline */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct-from-Source Artisan Marketplace</span>
            </div>

            {/* Editorial Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-editorial text-slate-900 tracking-tight leading-[1.12]">
              Where Local Craftsmanship <br className="hidden sm:inline" />
              Meets Intelligent Commerce
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Connect directly with verified local pottery studios, forest apiaries, and master handloom weavers. Authentic creations backed by smart business tools.
            </p>

            {/* Pill Search Bar with Categories */}
            <div className="bg-white rounded-full p-2 pl-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
              
              <div className="flex items-center flex-1 space-x-2.5">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search ceramic dinnerware, raw honey, handloom..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition shrink-0"
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Pills inside Search Bar */}
              <div className="flex items-center overflow-x-auto space-x-1.5 py-1 sm:py-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-3">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => onSelectCategory(cat.slug)}
                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition font-medium ${
                      activeCategory === cat.slug
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExplore}
                className="px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition flex items-center space-x-2.5 shadow-md glow-emerald cursor-pointer"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExplore}
                className="px-5 py-3.5 rounded-full text-slate-700 hover:text-emerald-700 hover:bg-white text-sm font-medium transition border border-transparent hover:border-slate-200"
              >
                Learn How It Works →
              </button>
            </div>

          </div>

          {/* Right Column: Artisan Spotlight Card (Replicating uploaded visual) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm sm:max-w-md">
              
              {/* Floating AI Business Tip Pill */}
              <div className="absolute -top-4 -right-2 sm:-right-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 flex items-center space-x-2.5 animate-bounce-subtle">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs">
                  ✨
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-800">AI Pricing Optimization</p>
                  <p className="text-[10px] text-emerald-600 font-medium">+32% vendor revenue</p>
                </div>
              </div>

              {/* Main Artisan Card */}
              <div
                onClick={() => onSelectVendor?.(1)}
                className="bg-white rounded-3xl p-5 shadow-xl border border-black/[0.06] transition hover:shadow-2xl cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label="View Priya's Studio artisan profile"
              >
                
                {/* Image */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=700&q=80"
                    alt="Priya's Studio - Handcrafted Pottery Wheel Work"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-800">5.0</span>
                    <span className="text-[10px] text-slate-500">(142)</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-editorial text-xl font-bold text-slate-900">Priya's Studio</h3>
                      <p className="text-xs text-slate-500">Jaipur, Rajasthan</p>
                    </div>
                    <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Master Potter</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    Hand-turned clay ceramics, high-fire stoneware dinner sets, and architectural pots handcrafted using traditional Rajasthani clay.
                  </p>
                </div>

                {/* Micro Product Preview Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Featured in Ceramics</span>
                  <span className="font-semibold text-emerald-700">From ₹449 →</span>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
