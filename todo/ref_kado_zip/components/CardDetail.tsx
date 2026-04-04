

import React, { useState, useMemo } from 'react';
import { Card, Currency, UserProfile, CardFinish } from '../types';
import { Icons } from './Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, convertPrice } from '../services/mockDataService';

interface CardDetailProps {
  card: Card;
  onClose: () => void;
  onCollectionUpdate: (action: 'add' | 'update' | 'delete', card: Card) => void;
  collection: Card[];
  currency: Currency;
  userProfile?: UserProfile;
  onUpgrade: () => void;
}

export const CardDetail: React.FC<CardDetailProps> = ({ card, onClose, onCollectionUpdate, collection, currency, userProfile, onUpgrade }) => {
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | 'All'>('3M');
  const [note, setNote] = useState(card.note || '');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [visibleMarkets, setVisibleMarkets] = useState({ tcgplayer: true, cardmarket: true, ebay: true });
  
  // New Variant States
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [newVariantCondition, setNewVariantCondition] = useState<'NM' | 'LP' | 'MP' | 'HP'>('NM');
  const [newVariantFinish, setNewVariantFinish] = useState<CardFinish>('Normal');
  const [newVariantQty, setNewVariantQty] = useState(1);

  // Tags State
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Identify siblings (variants of the same card)
  // We match by name, set, and number.
  const siblings = useMemo(() => {
    return collection.filter(c => 
      c.name === card.name && 
      c.set === card.set && 
      c.number === card.number
    ).sort((a, b) => {
      // Sort by condition (NM first) then finish
      const condOrder = { 'NM': 0, 'LP': 1, 'MP': 2, 'HP': 3 };
      const finishOrder = { 'Normal': 0, 'Foil': 1, 'Reverse Holo': 2, 'Etched': 3 };
      
      const condA = condOrder[a.condition || 'NM'];
      const condB = condOrder[b.condition || 'NM'];
      if (condA !== condB) return condA - condB;

      const finishA = finishOrder[a.finish || 'Normal'];
      const finishB = finishOrder[b.finish || 'Normal'];
      return finishA - finishB;
    });
  }, [collection, card]);

  // Calculate total holdings for this card species
  const totalQuantity = siblings.reduce((acc, c) => acc + (c.quantity || 1), 0);
  const totalValue = siblings.reduce((acc, c) => acc + (c.price * (c.quantity || 1)), 0);

  // Favorites Logic (Apply to all variants or just the main one? Usually per species, but let's stick to the passed card for now or allow syncing)
  const isFavorite = card.customGroups?.includes('favorites') || false;
  const isPro = !!userProfile?.isPro;
  const primaryMarket = userProfile?.primaryMarket || 'TCGplayer';

  const toggleFavorite = () => {
    // Toggle for ALL siblings to keep it consistent
    const shouldFavorite = !isFavorite;
    siblings.forEach(sibling => {
       const currentGroups = sibling.customGroups || [];
       let newGroups;
       if (!shouldFavorite) {
           newGroups = currentGroups.filter(g => g !== 'favorites');
       } else {
           if (!currentGroups.includes('favorites')) newGroups = [...currentGroups, 'favorites'];
           else newGroups = currentGroups;
       }
       onCollectionUpdate('update', { ...sibling, customGroups: newGroups });
    });
  };

  // Prepare Multi-Source Chart Data
  const chartData = useMemo(() => {
    if (!card.marketData) return [];
    
    const tcgHistory = card.marketData.tcgplayer.priceHistory || [];
    const cmHistory = card.marketData.cardmarket.priceHistory || [];
    const ebayHistory = card.marketData.ebay.priceHistory || [];

    let days = 90;
    if (timeRange === '1W') days = 7;
    if (timeRange === '1M') days = 30;
    if (timeRange === '3M') days = 90;
    if (timeRange === 'All' && isPro) days = tcgHistory.length;

    return tcgHistory.slice(-days).map((p: any, i: number) => ({
        date: p.date,
        tcgplayer: convertPrice(p.price, currency),
        cardmarket: convertPrice(cmHistory[cmHistory.length - days + i]?.price || 0, currency),
        ebay: convertPrice(ebayHistory[ebayHistory.length - days + i]?.price || 0, currency),
    }));
  }, [card.marketData, timeRange, currency, isPro]);

  const handleVariantQuantity = (variant: Card, delta: number) => {
    const newQuantity = (variant.quantity || 1) + delta;
    if (newQuantity < 1) {
        if (confirm('Remove this variant from your collection?')) {
            onCollectionUpdate('delete', variant);
        }
    } else {
        onCollectionUpdate('update', { ...variant, quantity: newQuantity });
    }
  };

  const handleAddVariant = () => {
      const newCard: Card = {
          ...card,
          id: crypto.randomUUID(),
          condition: newVariantCondition,
          finish: newVariantFinish,
          quantity: newVariantQty,
          dateAdded: new Date().toISOString(),
          isNew: true
      };
      onCollectionUpdate('add', newCard);
      setIsAddingVariant(false);
      setNewVariantQty(1);
  };

  const handleSaveNote = () => {
    onCollectionUpdate('update', { ...card, note });
    setIsEditingNote(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to remove ALL versions of this card from your collection?')) {
        siblings.forEach(s => onCollectionUpdate('delete', s));
        onClose();
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
      e.preventDefault();
      if (!tagInput.trim()) return;
      
      const currentTags = card.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
          onCollectionUpdate('update', { ...card, tags: [...currentTags, tagInput.trim()] });
      }
      setTagInput('');
      setIsAddingTag(false);
  };

  const removeTag = (tagToRemove: string) => {
      const currentTags = card.tags || [];
      onCollectionUpdate('update', { ...card, tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const handleLegendClick = (dataKey: string) => {
    if (!isPro) return;
    setVisibleMarkets(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin({ x, y });
  };

  const toggleZoom = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsZoomed(!isZoomed);
  };

  const MarketSourceCard = ({ source, color, data, isLocked }: { source: string, color: string, data: any, isLocked: boolean }) => {
      if (!data) return null;
      const price = convertPrice(data.price, currency);
      const change = data.dayChange;
      const isUp = change >= 0;

      return (
        <div className={`bg-navy/40 border border-white/5 p-2 sm:p-4 rounded-xl flex flex-col justify-between flex-1 min-w-0 relative overflow-hidden transition-all
          ${isLocked ? 'blur-[3px] opacity-60' : ''}
        `}>
            <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`}></div>
                <span className="text-[10px] font-bold text-slate-text truncate">{source}</span>
            </div>
            <div>
                <p className="text-sm sm:text-lg font-bold text-light-slate truncate">{formatCurrency(price, currency)}</p>
                <p className={`text-[9px] font-bold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? '+' : ''}{change.toFixed(2)}%
                </p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/5">
                 <p className="text-[9px] text-slate-text mb-1.5 truncate">{data.listingCount} listings</p>
                 <button className={`w-full py-1.5 rounded-md text-[9px] font-bold text-white shadow-lg transition-transform active:scale-95 truncate px-1 ${source === 'TCGplayer' ? 'bg-blue-600 hover:bg-blue-500' : source === 'Cardmarket' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-600 hover:bg-red-500'}`}>
                    <span className="sm:hidden">Buy</span>
                    <span className="hidden sm:inline">Buy on {source}</span>
                 </button>
            </div>

            {isLocked && (
              <div onClick={onUpgrade} className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer group">
                  <div className="bg-umber/80 text-midnight px-3 py-1.5 rounded-full text-[9px] font-bold flex items-center gap-1.5 backdrop-blur-sm border border-white/20 shadow-lg group-hover:scale-105 transition-transform">
                      <Icons.Lock size={10} />
                      <span>PRO</span>
                  </div>
              </div>
            )}
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4">
      {/* Image Expansion Overlay */}
      {isImageExpanded && (
        <div 
            className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up"
            onClick={() => { setIsImageExpanded(false); setIsZoomed(false); }}
        >
             <div className={`relative transition-all duration-300 ${isZoomed ? 'w-full h-full overflow-hidden flex items-center justify-center' : ''}`}>
                <img 
                    src={card.imageUrl} 
                    alt={card.name} 
                    onClick={toggleZoom}
                    onMouseMove={handleImageMouseMove}
                    className={`
                        rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-100 ease-out
                        ${isZoomed ? 'cursor-zoom-out max-w-none max-h-none' : 'cursor-zoom-in max-w-full max-h-[90vh] object-contain'}
                    `}
                    style={isZoomed ? {
                        transform: 'scale(2.5)',
                        transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
                    } : {}}
                />
            </div>
            {!isZoomed && (
                 <p className="absolute bottom-8 text-white/50 text-xs pointer-events-none font-medium tracking-wider uppercase">Tap to Zoom</p>
            )}
            <button 
                onClick={() => { setIsImageExpanded(false); setIsZoomed(false); }}
                className="absolute top-6 right-6 p-3 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md z-50"
            >
                <Icons.Close size={24} />
            </button>
        </div>
      )}

      <div className="absolute inset-0 bg-midnight/95 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-midnight border border-white/10 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        
        {/* Header / Close */}
        <div className="absolute top-4 right-4 z-20">
            <button onClick={onClose} className="p-2 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors backdrop-blur-md">
                <Icons.Close size={20} />
            </button>
        </div>

        <div className="overflow-y-auto no-scrollbar flex-1 pb-8">
            
            {/* Top Section: Image & Core Info */}
            <div className="p-6 pb-0">
                <div className="flex gap-4">
                    {/* Card Image */}
                    <div 
                        className="w-24 h-32 sm:w-32 sm:h-44 shrink-0 bg-navy rounded-xl overflow-hidden shadow-lg relative group cursor-zoom-in"
                        onClick={() => setIsImageExpanded(true)}
                    >
                         <img 
                           src={card.imageUrl} 
                           alt={card.name} 
                           className="w-full h-full object-cover mx-auto transition-transform duration-500 group-hover:scale-110" 
                         />
                         
                         {/* Foil Effect Overlay */}
                         {card.finish === 'Foil' && (
                             <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay bg-[linear-gradient(135deg,transparent_30%,rgba(255,255,255,0.5)_50%,transparent_70%)]"></div>
                         )}

                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Icons.Maximize size={24} className="text-white drop-shadow-lg" />
                         </div>
                         {/* Total Qty Badge on Image */}
                         <div className="absolute top-2 right-2 bg-midnight/80 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                             x{totalQuantity}
                         </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-brand-primary tracking-widest uppercase">{card.rarity}</span>
                            <div className="h-px flex-1 bg-white/10"></div>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-1">{card.name}</h2>
                        <p className="text-xs text-slate-text mb-4">{card.set} • {card.number}</p>
                        
                        <button 
                            onClick={toggleFavorite}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95
                                ${isFavorite ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-navy border border-white/10 text-light-slate hover:bg-white/5'}
                            `}
                        >
                            <Icons.Star size={14} fill={isFavorite ? "currentColor" : "none"} />
                            {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="mt-6 px-2">
                <div className="flex items-center justify-end px-4 mb-2 gap-2">
                    {(['1W', '1M', '3M', 'All'] as const).map(range => {
                        const isLocked = range === 'All' && !isPro;
                        return (
                            <button
                                key={range}
                                onClick={() => isLocked ? onUpgrade() : setTimeRange(range)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1
                                    ${timeRange === range 
                                        ? 'bg-umber text-midnight' 
                                        : isLocked 
                                            ? 'bg-white/5 text-slate-text/60 cursor-pointer hover:text-amber-400 hover:bg-white/10' 
                                            : 'text-slate-text hover:text-white bg-white/5'
                                    }`}
                            >
                                {range}
                                {isLocked && <Icons.Lock size={8} className="mb-0.5" />}
                            </button>
                        );
                    })}
                </div>
                
                <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <filter id="blur-line" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" hide />
                            <YAxis 
                                domain={['auto', 'auto']} 
                                tick={{fontSize: 10, fill: '#8892b0'}} 
                                tickFormatter={(val) => formatCurrency(val, currency).split('.')[0]} // Shorten axis labels
                                axisLine={false}
                                tickLine={false}
                                width={40}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0a192f', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                                itemStyle={{ fontSize: '12px' }}
                                labelStyle={{ color: '#8892b0', fontSize: '10px', marginBottom: '4px' }}
                                formatter={(value: number, name: string) => {
                                    const isLocked = !isPro && name.toLowerCase() !== primaryMarket.toLowerCase();
                                    return [isLocked ? '---' : formatCurrency(value, currency), ''];
                                }}
                            />
                             <Legend 
                                iconType="circle" 
                                wrapperStyle={{fontSize: '10px', paddingTop: '10px', cursor: isPro ? 'pointer' : 'default'}}
                                onClick={(e: any) => handleLegendClick(e.dataKey)}
                                formatter={(value, entry) => {
                                    const dataKey = entry.dataKey as keyof typeof visibleMarkets;
                                    const isVisible = visibleMarkets[dataKey];
                                    const isLocked = !isPro && value.toLowerCase() !== primaryMarket.toLowerCase();
                                    return <span style={{ color: (isPro && !isVisible) || isLocked ? '#555' : '#ccd6f6' }}>{value}</span>
                                }}
                            />
                            
                            {/* TCGplayer */}
                            <Line 
                                hide={!visibleMarkets.tcgplayer}
                                type="monotone" 
                                dataKey="tcgplayer" 
                                name="TCGplayer" 
                                stroke="#3b82f6" 
                                strokeWidth={(!isPro && primaryMarket !== 'TCGplayer') ? 4 : 2} 
                                dot={false}
                                activeDot={(!isPro && primaryMarket !== 'TCGplayer') ? false : {r: 5}}
                                strokeOpacity={(!isPro && primaryMarket !== 'TCGplayer') ? 0.15 : 1}
                                style={(!isPro && primaryMarket !== 'TCGplayer') ? { filter: 'url(#blur-line)' } : undefined}
                            />
                            
                            {/* Cardmarket */}
                            <Line 
                                hide={!visibleMarkets.cardmarket}
                                type="monotone" 
                                dataKey="cardmarket" 
                                name="Cardmarket" 
                                stroke="#f59e0b" 
                                strokeWidth={(!isPro && primaryMarket !== 'Cardmarket') ? 4 : 2} 
                                dot={false}
                                activeDot={(!isPro && primaryMarket !== 'Cardmarket') ? false : {r: 5}}
                                strokeOpacity={(!isPro && primaryMarket !== 'Cardmarket') ? 0.15 : 1}
                                style={(!isPro && primaryMarket !== 'Cardmarket') ? { filter: 'url(#blur-line)' } : undefined}
                            />
                            
                            {/* eBay */}
                            <Line 
                                hide={!visibleMarkets.ebay}
                                type="monotone" 
                                dataKey="ebay" 
                                name="eBay" 
                                stroke="#ef4444" 
                                strokeWidth={(!isPro && primaryMarket !== 'eBay') ? 4 : 2} 
                                dot={false}
                                activeDot={(!isPro && primaryMarket !== 'eBay') ? false : {r: 5}}
                                strokeOpacity={(!isPro && primaryMarket !== 'eBay') ? 0.15 : 1}
                                style={(!isPro && primaryMarket !== 'eBay') ? { filter: 'url(#blur-line)' } : undefined}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Market Sources */}
            <div className="px-4 sm:px-6 mt-6">
                <div className="grid grid-cols-3 gap-2">
                    {card.marketData && userProfile && (
                        <>
                            <MarketSourceCard source="TCGplayer" color="bg-blue-500" data={card.marketData.tcgplayer} isLocked={!userProfile.isPro && userProfile.primaryMarket !== 'TCGplayer'} />
                            <MarketSourceCard source="Cardmarket" color="bg-amber-500" data={card.marketData.cardmarket} isLocked={!userProfile.isPro && userProfile.primaryMarket !== 'Cardmarket'}/>
                            <MarketSourceCard source="eBay" color="bg-red-500" data={card.marketData.ebay} isLocked={!userProfile.isPro && userProfile.primaryMarket !== 'eBay'}/>
                        </>
                    )}
                </div>
            </div>

            {/* Tags Section */}
            <div className="px-6 mt-6">
                <div className="bg-navy/30 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-text uppercase tracking-wider flex items-center gap-2">
                            <Icons.Tag size={12} /> Tags
                        </span>
                        <button 
                            onClick={() => setIsAddingTag(!isAddingTag)} 
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-text hover:text-white transition-colors"
                        >
                            <Icons.Plus size={12} />
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {(card.tags || []).map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-300 text-[10px] font-bold border border-blue-500/20 group cursor-pointer hover:bg-blue-500/20 transition-colors">
                                {tag}
                                <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="hover:text-white">
                                    <Icons.Close size={10} />
                                </button>
                            </span>
                        ))}
                        {(card.tags || []).length === 0 && !isAddingTag && (
                            <span className="text-[10px] text-slate-500 italic">No tags added.</span>
                        )}
                    </div>

                    {isAddingTag && (
                        <form onSubmit={handleAddTag} className="flex gap-2 mt-2">
                            <input 
                                autoFocus
                                type="text" 
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="Add tag..."
                                className="flex-1 bg-midnight border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                            <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs font-bold">Add</button>
                        </form>
                    )}
                </div>
            </div>

            {/* Inventory & Variants Section */}
            <div className="px-6 mt-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-bold text-light-slate">Inventory</h3>
                    <span className="text-xs text-slate-text">Total: {totalQuantity}</span>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 font-bold">
                      {formatCurrency(totalValue, currency)}
                  </div>
                </div>

                {/* Variants List */}
                <div className="space-y-3 mb-4">
                    {siblings.map((variant) => {
                        const isSelectedVariant = variant.id === card.id;
                        const condColor = {
                            'NM': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
                            'LP': 'text-emerald-200 bg-emerald-200/10 border-emerald-200/20',
                            'MP': 'text-amber-200 bg-amber-200/10 border-amber-200/20',
                            'HP': 'text-rose-400 bg-rose-400/10 border-rose-400/20'
                        }[variant.condition || 'NM'];

                        return (
                            <div key={variant.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelectedVariant ? 'bg-white/5 border-umber/50 shadow-soft-lg' : 'bg-navy/30 border-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    {/* Condition Badge */}
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${condColor}`}>
                                        {variant.condition || 'NM'}
                                    </div>
                                    
                                    {/* Finish Info */}
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-bold text-light-slate">{variant.finish || 'Normal'}</span>
                                            {(variant.finish === 'Foil' || variant.finish === 'Reverse Holo') && (
                                                <Icons.Zap size={10} className="text-amber-400 fill-amber-400" />
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-text">
                                            Added: {new Date(variant.dateAdded).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Qty Control */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-midnight/50 rounded-lg border border-white/5">
                                        <button onClick={() => handleVariantQuantity(variant, -1)} className="w-7 h-7 flex items-center justify-center text-slate-text hover:text-rose-400 transition-colors"><Icons.Minus size={12} /></button>
                                        <span className="w-6 text-center text-xs font-bold text-white">{variant.quantity || 1}</span>
                                        <button onClick={() => handleVariantQuantity(variant, 1)} className="w-7 h-7 flex items-center justify-center text-slate-text hover:text-emerald-400 transition-colors"><Icons.Plus size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Variant Button */}
                {!isAddingVariant ? (
                    <button 
                        onClick={() => setIsAddingVariant(true)}
                        className="w-full py-3 rounded-xl border border-dashed border-white/20 text-slate-text text-xs font-bold hover:bg-white/5 hover:text-light-slate hover:border-white/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Icons.Plus size={14} />
                        Add Variant
                    </button>
                ) : (
                    <div className="bg-navy/50 border border-white/10 rounded-xl p-4 animate-fade-in-up">
                        <h4 className="text-xs font-bold text-light-slate mb-3 uppercase tracking-wider">New Variant Config</h4>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] text-slate-text mb-1.5 font-bold">Condition</label>
                                <div className="grid grid-cols-2 gap-1">
                                    {['NM', 'LP', 'MP', 'HP'].map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setNewVariantCondition(c as any)}
                                            className={`py-1.5 rounded text-[10px] font-bold transition-colors ${newVariantCondition === c ? 'bg-umber text-midnight' : 'bg-midnight border border-white/10 text-slate-text hover:bg-white/5'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-text mb-1.5 font-bold">Finish</label>
                                <select 
                                    value={newVariantFinish}
                                    onChange={(e) => setNewVariantFinish(e.target.value as CardFinish)}
                                    className="w-full bg-midnight border border-white/10 text-xs text-light-slate rounded-lg p-1.5 focus:outline-none focus:border-umber"
                                >
                                    <option value="Normal">Normal</option>
                                    <option value="Foil">Foil</option>
                                    <option value="Reverse Holo">Reverse Holo</option>
                                    <option value="Etched">Etched</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                             <label className="block text-[10px] text-slate-text mb-1.5 font-bold">Quantity</label>
                             <div className="flex items-center gap-3">
                                 <input 
                                    type="range" 
                                    min="1" 
                                    max="20" 
                                    value={newVariantQty} 
                                    onChange={(e) => setNewVariantQty(parseInt(e.target.value))}
                                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-umber"
                                 />
                                 <span className="text-sm font-bold text-white w-6 text-right">{newVariantQty}</span>
                             </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsAddingVariant(false)}
                                className="flex-1 py-2 rounded-lg bg-white/5 text-xs font-bold text-slate-text hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAddVariant}
                                className="flex-1 py-2 rounded-lg bg-emerald-500 text-midnight text-xs font-bold hover:bg-emerald-400 transition-colors shadow-lg"
                            >
                                Confirm Add
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="mt-8 space-y-3">
                    {/* Notes */}
                    <div className="bg-navy/30 p-3 rounded-xl border border-white/5">
                         <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-midnight border border-white/10 flex items-center justify-center text-slate-text">
                                    <Icons.Edit size={16} />
                                </div>
                                <span className="text-sm font-medium text-light-slate">Master Notes</span>
                             </div>
                             <button onClick={() => isEditingNote ? handleSaveNote() : setIsEditingNote(true)} className="text-xs text-umber hover:underline">
                                {isEditingNote ? 'Save' : 'Edit'}
                             </button>
                         </div>
                         {isEditingNote ? (
                             <textarea 
                                 value={note}
                                 onChange={(e) => setNote(e.target.value)}
                                 className="w-full bg-midnight border border-white/10 rounded-lg p-2 text-xs text-light-slate focus:outline-none focus:border-umber min-h-[60px]"
                             />
                         ) : (
                             <p className="text-xs text-slate-text pl-11">{note || "No notes added."}</p>
                         )}
                    </div>

                    {/* Delete All */}
                    <button 
                        onClick={handleDelete}
                        className="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 font-bold text-xs hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Icons.Trash2 size={14} />
                        Remove All Variants
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};