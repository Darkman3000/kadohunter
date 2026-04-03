
import React, { useState, useMemo } from 'react';
import { Card, Currency, UserProfile, ArbitrageOpportunity, MarketNews } from '../types';
import { Icons } from './Icons';
import { generateMarketData, formatCurrency } from '../services/mockDataService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Scrolling Ticker
const MarketTicker = ({ items }: { items: any[] }) => {
    // Duplicate items 4x to ensure enough content for seamless looping on wide screens
    const tickerItems = [...items, ...items, ...items, ...items];

    return (
        <div className="w-full bg-midnight border-b border-white/5 py-1.5 overflow-hidden relative group cursor-default">
            {/* Gradient masks for smooth fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-midnight to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-midnight to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
                 {tickerItems.map((item, i) => (
                     <div key={i} className="flex items-center gap-2 mx-4 md:mx-8 text-[10px] uppercase tracking-wider shrink-0">
                         <span className="font-bold text-slate-400">{item.name}</span>
                         <span className={`${item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono font-bold`}>
                             {item.change24h > 0 ? '+' : ''}{item.change24h.toFixed(1)}%
                         </span>
                     </div>
                 ))}
            </div>
        </div>
    );
};

const ArbitrageModal = ({ opportunity, onClose, currency }: { opportunity: ArbitrageOpportunity, onClose: () => void, currency: Currency }) => {
    if (!opportunity) return null;

    // Simple analysis logic
    const feesRate = 0.13; // 13% platform fees
    const shippingEst = 4.00; // Flat shipping estimate
    const fees = opportunity.sellPrice * feesRate;
    const totalCost = opportunity.buyPrice + fees + shippingEst;
    const netProfit = opportunity.sellPrice - totalCost;
    const roi = (netProfit / opportunity.buyPrice) * 100;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                {/* Header with Card bg */}
                <div className="relative h-32 bg-midnight overflow-hidden">
                    <img src={opportunity.imageUrl} className="absolute w-full h-full object-cover opacity-40 blur-sm" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                        <div>
                            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Arbitrage Opportunity</p>
                            <h2 className="text-xl font-bold text-white truncate">{opportunity.cardName}</h2>
                            <p className="text-xs text-slate-400">{opportunity.setName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors backdrop-blur-md border border-white/10">
                            <Icons.Close size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Price Comparison */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Buy From</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-300">{opportunity.buySource}</span>
                            </div>
                            <p className="text-lg font-mono font-bold text-emerald-400">{formatCurrency(opportunity.buyPrice, currency)}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Sell On</p>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-sm font-bold text-slate-300">{opportunity.sellSource}</span>
                            </div>
                            <p className="text-lg font-mono font-bold text-white">{formatCurrency(opportunity.sellPrice, currency)}</p>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Gross Spread</span>
                            <span className="text-white font-mono">{formatCurrency(opportunity.spread, currency)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Est. Fees (13%)</span>
                            <span className="text-rose-400 font-mono">-{formatCurrency(fees, currency)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Est. Shipping</span>
                            <span className="text-rose-400 font-mono">-{formatCurrency(shippingEst, currency)}</span>
                        </div>
                        <div className="h-px bg-white/10 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-300">Projected Net Profit</span>
                            <div className="text-right">
                                <p className={`text-xl font-bold font-mono ${netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(netProfit, currency)}
                                </p>
                                <p className={`text-[10px] font-bold ${netProfit > 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                                    {roi.toFixed(1)}% ROI
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 transition-colors">
                            View Listing
                        </button>
                        <button onClick={onClose} className="py-3 bg-umber text-midnight rounded-xl text-xs font-bold hover:bg-umber-dark transition-colors shadow-lg flex items-center justify-center gap-2">
                            <Icons.CheckCircle size={16} />
                            Track This
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NewsModal = ({ item, onClose }: { item: MarketNews, onClose: () => void }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="relative h-48 md:h-64">
           <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title} />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent"></div>
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-white/10 rounded-full text-white backdrop-blur-md transition-colors">
             <Icons.Close size={20} />
           </button>
        </div>
        <div className="p-6 md:p-8">
           <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold text-umber px-2 py-1 bg-umber/10 rounded border border-umber/20">{item.source}</span>
              <span className="text-xs text-slate-400">{item.date}</span>
           </div>
           <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{item.title}</h2>
           <p className="text-slate-300 leading-relaxed mb-6">{item.snippet} {item.snippet} This article explores the recent market dynamics impacting key sets. Collectors are advised to monitor these trends closely as liquidity shifts towards vintage staples.</p>
           
           <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors w-full md:w-auto justify-center">
              <span>Read Full Article</span>
              <Icons.ExternalLink size={16} />
           </button>
        </div>
      </div>
    </div>
  );
};

const AnalyticsDashboard = () => {
    // Mock Data for Charts
    const marketIndexData = useMemo(() => {
        const data = [];
        let value = 1000;
        for(let i=30; i>=0; i--) {
            value = value * (1 + (Math.random() - 0.45) * 0.05);
            data.push({ day: i === 0 ? 'Today' : `${i}d ago`, value: Math.floor(value) });
        }
        return data;
    }, []);

    const volumeData = [
        { name: 'Pokemon', value: 450, color: '#eab308' },
        { name: 'Magic', value: 320, color: '#f97316' },
        { name: 'Yu-Gi-Oh!', value: 210, color: '#a855f7' },
        { name: 'One Piece', value: 180, color: '#ef4444' },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Market Index Chart */}
            <div className="bg-navy/40 border border-white/5 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-light-slate">Kado 500 Index</h3>
                        <p className="text-xs text-slate-500">Aggregate performance of top 500 cards</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-mono font-bold text-emerald-400">+12.4%</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">30 Day Trend</p>
                    </div>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={marketIndexData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#c7a77b" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#c7a77b" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="day" hide />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                itemStyle={{ color: '#c7a77b' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#c7a77b" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Volume Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-navy/40 border border-white/5 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-light-slate mb-4">Volume by Game</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={volumeData} 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {volumeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                        {volumeData.map(d => (
                            <div key={d.name} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
                                <span className="text-[10px] text-slate-400">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-navy/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-center">
                     <h3 className="text-lg font-bold text-light-slate mb-4">Market Sentiment</h3>
                     <div className="space-y-4">
                         <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
                             <span className="text-sm font-bold text-emerald-400">Bullish</span>
                             <span className="text-xs text-slate-400">Vintage Pokemon, One Piece Meta</span>
                         </div>
                         <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center justify-between">
                             <span className="text-sm font-bold text-rose-400">Bearish</span>
                             <span className="text-xs text-slate-400">Modern MTG Sealed, Low-end Slabs</span>
                         </div>
                         <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                             <span className="text-sm font-bold text-blue-400">Neutral</span>
                             <span className="text-xs text-slate-400">Yu-Gi-Oh! Core Sets</span>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    )
}

type MarketTab = 'overview' | 'analytics' | 'arbitrage' | 'wishlist';

interface MarketViewProps {
  cards: Card[];
  currency: Currency;
  onCardClick: (card: Card) => void;
  userProfile: UserProfile;
  onUpgrade: () => void;
}

export const MarketView: React.FC<MarketViewProps> = ({ cards, currency, onCardClick, userProfile, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<MarketTab>('overview');
  const [wishlistViewMode, setWishlistViewMode] = useState<'grid' | 'list'>('list');
  const [selectedOpp, setSelectedOpp] = useState<ArbitrageOpportunity | null>(null);
  const [selectedNews, setSelectedNews] = useState<MarketNews | null>(null);
  const { gainers, losers, heatmap, news, arbitrage } = useMemo(() => generateMarketData(), []);
  
  // Filter wishlist items
  const wishlistItems = useMemo(() => cards.filter(c => c.customGroups?.includes('favorites') || c.tags?.includes('Wishlist') || c.tags?.includes('wishlist')), [cards]);

  const tabs: {id: MarketTab, label: string, icon?: React.ElementType}[] = [
      { id: 'overview', label: 'Dashboard' },
      { id: 'analytics', label: 'Analytics', icon: Icons.PieChart },
      { id: 'arbitrage', label: 'Arbitrage', icon: Icons.Zap },
      { id: 'wishlist', label: 'Wishlist', icon: Icons.Heart },
  ];

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 px-0 pt-0 font-sans bg-gradient-to-b from-midnight to-[#050e1c]">
      
      {selectedOpp && (
          <ArbitrageModal 
              opportunity={selectedOpp} 
              onClose={() => setSelectedOpp(null)} 
              currency={currency} 
          />
      )}

      {selectedNews && (
          <NewsModal 
              item={selectedNews} 
              onClose={() => setSelectedNews(null)} 
          />
      )}

      {/* Global Ticker */}
      <MarketTicker items={[...gainers, ...losers]} />

      <div className="max-w-[1800px] mx-auto p-4 lg:p-6">
          
          {/* Responsive Header - Flex Col on Mobile, Row on Desktop */}
          <header className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
              <div className="flex items-center justify-between w-full md:flex-1 md:pr-6">
                  <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-light-slate tracking-tight mb-1">Market Intelligence</h1>
                      <p className="text-slate-text text-xs md:text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Live Global Index • Updated 1m ago
                      </p>
                  </div>
              </div>
              
              <div className="w-full md:w-auto max-w-full">
                   {/* Tab Switcher */}
                   <div className="flex bg-navy/60 border border-white/5 p-1 rounded-xl backdrop-blur-md w-full md:w-auto">
                      {tabs.map(tab => {
                          const IconComponent = tab.icon;
                          const isActive = activeTab === tab.id;
                          
                          return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 md:flex-none rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2 py-2 md:px-4
                                    ${isActive ? 'bg-umber text-midnight shadow-lg' : 'text-slate-text hover:text-light-slate hover:bg-white/5'}
                                `}
                            >
                                {IconComponent && <IconComponent size={14} fill={isActive && tab.id !== 'analytics' ? 'currentColor' : 'none'} className={isActive ? '' : 'opacity-70'} />}
                                <span>{tab.label}</span>
                            </button>
                          );
                      })}
                  </div>
              </div>
          </header>

          {/* Content Area */}
          <div className="space-y-6">
             {activeTab === 'overview' && (
                 <>
                    {/* Market Movers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {gainers.slice(0, 4).map(card => (
                            <div key={card.id} onClick={() => onCardClick(card)} className="bg-navy/40 border border-white/5 rounded-2xl p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors">
                                <div className="w-16 h-20 bg-midnight rounded-md overflow-hidden shrink-0">
                                    <img src={card.imageUrl} className="w-full h-full object-cover" alt={card.name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-light-slate text-sm truncate mb-0.5">{card.name}</h3>
                                    <p className="text-xs text-slate-text truncate mb-2">{card.set}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-umber">{formatCurrency(card.price, currency)}</span>
                                        <span className="text-xs font-bold text-emerald-400">+{card.change24h.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* News Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         <div className="lg:col-span-2 space-y-4">
                             <div className="flex items-center justify-between">
                                 <h2 className="text-lg font-bold text-light-slate">Latest Intelligence</h2>
                                 <button className="text-xs font-bold text-umber hover:text-white">View All</button>
                             </div>
                             {news.slice(0, 3).map(item => (
                                 <div 
                                    key={item.id} 
                                    onClick={() => setSelectedNews(item)}
                                    className="bg-navy/30 border border-white/5 rounded-2xl p-4 flex gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
                                 >
                                     <div className="w-24 h-16 bg-midnight rounded-md overflow-hidden shrink-0 relative border border-white/5">
                                         <img src={item.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" alt="" />
                                     </div>
                                     <div className="flex-1">
                                         <div className="flex items-center gap-2 mb-1">
                                             <span className="text-[10px] font-bold text-umber bg-umber/10 px-1.5 py-0.5 rounded">{item.source}</span>
                                             <span className="text-[10px] text-slate-500">{item.date}</span>
                                         </div>
                                         <h3 className="font-bold text-light-slate text-sm leading-snug mb-1 group-hover:text-white transition-colors">{item.title}</h3>
                                         <p className="text-xs text-slate-400 line-clamp-1">{item.snippet}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                         
                         {/* Heatmap Widget */}
                         <div className="bg-navy/30 border border-white/5 rounded-2xl p-4 flex flex-col">
                             <h2 className="text-lg font-bold text-light-slate mb-4">Sector Heatmap</h2>
                             <div className="flex-1 grid grid-cols-3 gap-1">
                                 {heatmap.map(card => {
                                     const opacity = Math.min(Math.abs(card.performance) * 5 + 0.1, 1);
                                     const color = card.performance > 0 ? `rgba(16, 185, 129, ${opacity})` : `rgba(244, 63, 94, ${opacity})`;
                                     return (
                                         <div 
                                            key={card.id} 
                                            className="rounded flex items-center justify-center relative group overflow-hidden bg-midnight aspect-square cursor-help"
                                            style={{ backgroundColor: color }}
                                            title={`${card.name}: ${(card.performance * 100).toFixed(1)}%`}
                                         >
                                             <span className="relative z-10 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                 {(card.performance * 100).toFixed(0)}%
                                             </span>
                                         </div>
                                     )
                                 })}
                             </div>
                             <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase">
                                 <span>Bearish</span>
                                 <span>Bullish</span>
                             </div>
                         </div>
                    </div>
                 </>
             )}

             {activeTab === 'arbitrage' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
                     {arbitrage.map((opp) => (
                         <div key={opp.id} className="bg-navy/40 border border-white/5 rounded-2xl p-4 relative overflow-hidden group hover:border-umber/30 transition-colors">
                             <div className="flex items-start gap-4 mb-4">
                                 <div className="w-16 h-20 bg-midnight rounded-md overflow-hidden shrink-0 border border-white/10">
                                     <img src={opp.imageUrl} className="w-full h-full object-cover" alt={opp.cardName} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <h3 className="font-bold text-light-slate text-sm truncate">{opp.cardName}</h3>
                                     <p className="text-xs text-slate-text truncate mb-2">{opp.setName}</p>
                                     <div className="flex items-center gap-2">
                                         <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                             {opp.spreadPercent.toFixed(1)}% Spread
                                         </span>
                                         <span className="text-[10px] text-slate-500">{opp.foundAt}</span>
                                     </div>
                                 </div>
                             </div>
                             
                             <div className="flex items-center justify-between p-3 bg-midnight/50 rounded-xl mb-3">
                                 <div>
                                     <p className="text-[9px] text-slate-500 uppercase font-bold">Buy @ {opp.buySource}</p>
                                     <p className="text-sm font-mono font-bold text-emerald-400">{formatCurrency(opp.buyPrice, currency)}</p>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-[9px] text-slate-500 uppercase font-bold">Sell @ {opp.sellSource}</p>
                                     <p className="text-sm font-mono font-bold text-slate-300">{formatCurrency(opp.sellPrice, currency)}</p>
                                 </div>
                             </div>
                             
                             <button 
                                onClick={() => setSelectedOpp(opp)}
                                className="w-full py-2 bg-umber text-midnight font-bold rounded-lg text-xs hover:bg-umber-dark transition-colors"
                             >
                                 Analyze Opportunity
                             </button>
                         </div>
                     ))}
                 </div>
             )}

             {activeTab === 'wishlist' && (
                 <>
                    {/* Wishlist Toolbar */}
                    <div className="flex justify-end mb-4 animate-fade-in-up">
                        <div className="flex bg-navy/60 p-1 rounded-lg border border-white/10 gap-1">
                            <button 
                                onClick={() => setWishlistViewMode('grid')}
                                className={`p-1.5 rounded-md transition-colors ${wishlistViewMode === 'grid' ? 'bg-umber text-midnight' : 'text-slate-400 hover:text-white'}`}
                                title="Grid View"
                            >
                                <Icons.Grid size={16} />
                            </button>
                            <button 
                                onClick={() => setWishlistViewMode('list')}
                                className={`p-1.5 rounded-md transition-colors ${wishlistViewMode === 'list' ? 'bg-umber text-midnight' : 'text-slate-400 hover:text-white'}`}
                                title="List View"
                            >
                                <Icons.List size={16} />
                            </button>
                        </div>
                    </div>

                    {wishlistItems.length > 0 ? (
                        <div className={`grid gap-4 animate-fade-in-up ${wishlistViewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}>
                            {wishlistItems.map(card => (
                                <div 
                                    key={card.id} 
                                    onClick={() => onCardClick(card)} 
                                    className={`
                                        bg-navy/40 border border-white/5 rounded-2xl p-3 flex cursor-pointer hover:bg-white/5 transition-colors group relative
                                        ${wishlistViewMode === 'list' ? 'flex-row gap-4 items-center' : 'flex-col gap-3'}
                                    `}
                                >
                                    <div className="absolute top-2 right-2 text-rose-500 z-10 p-1 bg-black/20 rounded-full backdrop-blur-sm border border-white/5">
                                        <Icons.Heart size={14} fill="currentColor" />
                                    </div>
                                    
                                    <div className={`bg-midnight rounded-md overflow-hidden shrink-0 border border-white/10 shadow-lg ${wishlistViewMode === 'list' ? 'w-16 h-20' : 'w-full aspect-[5/7]'}`}>
                                        <img src={card.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={card.name} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-light-slate text-sm truncate mb-0.5">{card.name}</h3>
                                        <p className="text-xs text-slate-text truncate mb-2">{card.set}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-umber">{formatCurrency(card.price, currency)}</span>
                                            {wishlistViewMode === 'list' && (
                                                <div className="text-[10px] text-slate-500 font-medium px-2 py-1 rounded bg-white/5">
                                                    Target: {formatCurrency(card.price * 0.9, currency)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <button 
                                onClick={() => setActiveTab('overview')} 
                                className={`
                                    bg-navy/20 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group
                                    ${wishlistViewMode === 'list' ? 'p-4 min-h-[100px]' : 'aspect-[5/7]'}
                                `}
                            >
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/10 transition-colors">
                                    <Icons.Plus size={24} className="text-slate-500 group-hover:text-white" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 group-hover:text-white">Add More</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 border border-rose-500/20">
                                <Icons.Heart size={32} className="text-rose-500" fill="currentColor" />
                            </div>
                            <h2 className="text-xl font-bold text-light-slate mb-2">Your Wishlist</h2>
                            <p className="text-sm text-slate-text max-w-xs mx-auto mb-6">
                                Track specific cards and get notified when they hit your target price.
                            </p>
                            <button 
                                onClick={() => setActiveTab('overview')}
                                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors"
                            >
                                Add First Card
                            </button>
                        </div>
                    )}
                 </>
             )}

             {activeTab === 'analytics' && <AnalyticsDashboard />}
          </div>
      </div>
    </div>
  );
};
