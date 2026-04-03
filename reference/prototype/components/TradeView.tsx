
import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from './Icons';
import { Card, Currency, FleaSession, ScanMode, TCG, CardLanguage } from '../types';
import { convertPrice, formatCurrency, useMockData } from '../services/mockDataService';
import { ScannerView } from './ScannerView';

interface TradeViewProps {
  collection?: Card[];
  currency?: Currency;
  onStartSession?: () => void;
  onImportCards?: (cards: Card[]) => void;
  initialTab?: 'desk' | 'flea';
  onNotify?: (msg: string) => void;
  onCardClick?: (card: Card) => void;
}

// --- Sub-Components ---

const TradeSettingsModal = ({ 
    isOpen, 
    onClose, 
    slippage, 
    setSlippage 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    slippage: number; 
    setSlippage: (val: number) => void; 
}) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
             <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-white">Trade Calibration</h3>
                     <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"><Icons.Close size={20} /></button>
                 </div>
                 
                 <div className="mb-8">
                     <div className="flex justify-between text-sm font-medium text-slate-300 mb-4">
                         <span>Fairness Tolerance</span>
                         <span className="text-umber font-mono font-bold">{slippage}%</span>
                     </div>
                     
                     <input 
                        type="range" 
                        min="0" 
                        max="20" 
                        step="1"
                        value={slippage} 
                        onChange={(e) => setSlippage(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-umber [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(199,167,123,0.5)]"
                     />

                     <div className="flex justify-between text-[10px] text-slate-500 mt-3 font-medium uppercase tracking-wider">
                         <span>Strict (0%)</span>
                         <span>Loose (20%)</span>
                     </div>
                 </div>
                 
                 <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-white text-midnight font-bold shadow-lg hover:bg-slate-200 transition-all">
                     Apply Settings
                 </button>
             </div>
        </div>
    );
};

const ManualAddModal = ({ 
    isOpen, 
    onClose, 
    onAdd, 
    side 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onAdd: (card: Card) => void;
    side: 'my' | 'their';
}) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [set, setSet] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numPrice = parseFloat(price);
        if (!name || isNaN(numPrice)) return;

        const newCard: Card = {
            id: `manual-${Date.now()}`,
            name,
            set: set || 'Unknown Set',
            setName: set || 'Unknown Set',
            price: numPrice,
            usMarketValue: numPrice,
            rarity: 'Common',
            number: '---',
            imageUrl: 'https://images.unsplash.com/photo-1620336655052-b68d975bf7c7?q=80&w=600&auto=format&fit=crop',
            dateAdded: new Date().toISOString(),
            condition: 'NM',
            marketTrend: 'stable',
            game: TCG.POKEMON,
            language: CardLanguage.ENGLISH,
            quantity: 1,
            isNew: true
        };
        onAdd(newCard);
        setName('');
        setPrice('');
        setSet('');
        onClose();
    };

    return (
        <div className="absolute inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-6">Add Custom Card</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Card Name</label>
                        <input 
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-umber outline-none mt-1 transition-colors"
                            placeholder="e.g. Black Lotus"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Set (Opt)</label>
                            <input 
                                value={set}
                                onChange={e => setSet(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-umber outline-none mt-1 transition-colors"
                                placeholder="Alpha"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Price ($)</label>
                            <input 
                                type="number"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-umber outline-none mt-1 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-slate-400 transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-umber text-midnight rounded-xl font-bold shadow-lg hover:bg-umber-dark transition-colors">Add Card</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main Trade View ---

export const TradeView: React.FC<TradeViewProps> = ({ collection = [], currency = Currency.USD, onStartSession, onImportCards, initialTab = 'desk', onNotify, onCardClick }) => {
  const [activeTab, setActiveTab] = useState<'desk' | 'flea'>('desk');
  
  // Trade Desk State
  const { mockCards } = useMockData();
  const [myOffer, setMyOffer] = useState<Card[]>([]);
  const [theirOffer, setTheirOffer] = useState<Card[]>([]);
  const [mySearch, setMySearch] = useState('');
  const [theirSearch, setTheirSearch] = useState('');
  
  // Mobile Tab State: 'mat' is the center desk, 'my' is my binder, 'their' is their binder
  const [mobileTradeTab, setMobileTradeTab] = useState<'mat' | 'my' | 'their'>('mat');
  
  // Desktop Panel State
  const [isMyBinderOpen, setIsMyBinderOpen] = useState(true);
  const [isTheirBinderOpen, setIsTheirBinderOpen] = useState(true);
  
  // Counterparty Inventory (Mock)
  const [theirCollection, setTheirCollection] = useState<Card[]>([]);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState(5); // Default 5% tolerance

  // Scanner & Manual Add State
  const [scannerState, setScannerState] = useState<{ active: boolean, side: 'my' | 'their' }>({ active: false, side: 'my' });
  const [manualState, setManualState] = useState<{ active: boolean, side: 'my' | 'their' }>({ active: false, side: 'my' });

  // Flea Market State
  const [fleaSessions, setFleaSessions] = useState<FleaSession[]>([]);

  // Initialize
  useEffect(() => {
      setTheirCollection(mockCards);
  }, []);

  useEffect(() => {
      if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const saved = localStorage.getItem('fleaSessions');
    if (saved) {
        try { setFleaSessions(JSON.parse(saved)); } catch(e){}
    }
  }, [activeTab]);

  // --- Trade Logic ---
  
  const myTotal = myOffer.reduce((acc, c) => acc + convertPrice(c.price, currency), 0);
  const theirTotal = theirOffer.reduce((acc, c) => acc + convertPrice(c.price, currency), 0);
  const netGain = theirTotal - myTotal;
  const totalTradeValue = myTotal + theirTotal;
  
  const toleranceAmount = Math.max(myTotal, theirTotal, 1) * (slippage / 100);
  const hasItems = myTotal > 0 || theirTotal > 0;
  const isBalanced = Math.abs(netGain) <= toleranceAmount && hasItems;
  
  // Calculate visual slide offset for the balance scale
  // Range: -1 (They have 100%) to 1 (You have 100%)
  // Desktop: You are Left, They are Right.
  // If You have more, slide Left (negative). If They have more, slide Right (positive).
  const balanceRatio = totalTradeValue > 0 ? (myTotal - theirTotal) / totalTradeValue : 0;
  // Limit slide to visually pleasing range (+/- 60px)
  const slideOffset = hasItems ? Math.max(Math.min(balanceRatio, 1), -1) * -60 : 0;

  // Filter Inventories
  const myInventory = useMemo(() => collection.filter(c => !myOffer.find(o => o.id === c.id) && c.name.toLowerCase().includes(mySearch.toLowerCase())), [collection, myOffer, mySearch]);
  const theirInventory = useMemo(() => theirCollection.filter(c => !theirOffer.find(o => o.id === c.id) && c.name.toLowerCase().includes(theirSearch.toLowerCase())), [theirCollection, theirOffer, theirSearch]);

  const addToOffer = (card: Card, side: 'my' | 'their') => {
      if (side === 'my') !myOffer.find(c => c.id === card.id) && setMyOffer([...myOffer, card]);
      else !theirOffer.find(c => c.id === card.id) && setTheirOffer([...theirOffer, card]);
      if (navigator.vibrate) navigator.vibrate(10);
  };

  const removeFromOffer = (cardId: string, side: 'my' | 'their') => {
      if (side === 'my') setMyOffer(myOffer.filter(c => c.id !== cardId));
      else setTheirOffer(theirOffer.filter(c => c.id !== cardId));
  };

  const handleConfirmTrade = () => {
    if (myOffer.length === 0 && theirOffer.length === 0) return;
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    onNotify?.("Trade deal recorded on the network.");
    setTimeout(() => {
        setMyOffer([]);
        setTheirOffer([]);
    }, 2000);
  };

  const handleAddCard = (card: Card, side: 'my' | 'their') => {
      if (side === 'my') onImportCards?.([card]);
      else setTheirCollection(prev => [card, ...prev]);
      onNotify?.(`Added ${card.name} to ${side === 'my' ? 'your binder' : 'counterparty'}.`);
  };

  // --- Render Helpers ---

  const renderInventoryPanel = (title: string, cards: Card[], side: 'my' | 'their', search: string, setSearch: (s: string) => void, bgClass = "bg-[#020617]") => (
      <div className={`flex flex-col h-full ${bgClass} border-x border-white/5 relative z-20 w-full shadow-2xl`}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-300 text-sm tracking-wide flex items-center gap-2">
                  <Icons.Binder size={14} className="text-slate-500" />
                  {title}
              </h3>
              <div className="flex gap-2">
                  <button onClick={() => setScannerState({active: true, side})} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><Icons.Scan size={14} /></button>
                  <button onClick={() => setManualState({active: true, side})} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><Icons.Plus size={14} /></button>
              </div>
          </div>
          
          <div className="px-4 py-3 shrink-0">
              <div className="relative">
                  <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter..." 
                    className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-300 focus:outline-none focus:border-white/20 transition-colors placeholder-slate-600"
                  />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
              {cards.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => onCardClick?.(c)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group text-left border border-transparent hover:border-white/5 active:scale-[0.98] cursor-pointer"
                  >
                      <div className="w-10 h-14 bg-black rounded-md overflow-hidden shrink-0 border border-white/10 relative shadow-md">
                          <img src={c.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-300 group-hover:text-white truncate transition-colors">{c.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{c.set}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-xs font-mono text-white/70 font-medium">{formatCurrency(convertPrice(c.price, currency), currency)}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToOffer(c, side); }}
                        className="opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 p-2 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-full"
                      >
                          <Icons.Plus size={16} />
                      </button>
                  </div>
              ))}
              {cards.length === 0 && (
                  <div className="text-center py-10 text-slate-600 text-xs italic">
                      Binder empty.
                  </div>
              )}
          </div>
      </div>
  );

  const renderActiveCard = (card: Card, side: 'my' | 'their') => (
      <div 
        key={card.id} 
        className="relative group animate-spring-up w-20 md:w-28 hover:z-20 transition-all duration-300 hover:scale-110 cursor-pointer active:scale-95"
        onClick={() => onCardClick?.(card)}
      >
          <div className="aspect-[5/7] rounded-md overflow-hidden border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative bg-black">
              <img src={card.imageUrl} className="w-full h-full object-cover" alt={card.name} />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
                  <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full border border-white/10">
                      {formatCurrency(convertPrice(card.price, currency), currency)}
                  </span>
                  <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromOffer(card.id, side); }}
                        className="p-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-400 transition-colors"
                      >
                          <Icons.Close size={12} strokeWidth={3} />
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden font-sans relative bg-black">
        
        <TradeSettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            slippage={slippage} 
            setSlippage={setSlippage} 
        />

        <ManualAddModal 
            isOpen={manualState.active}
            onClose={() => setManualState({...manualState, active: false})}
            onAdd={(card) => handleAddCard(card, manualState.side)}
            side={manualState.side}
        />

        {scannerState.active && (
            <div className="fixed inset-0 z-[150] bg-black">
                <ScannerView 
                    onCardScanned={(card) => {
                        handleAddCard(card, scannerState.side);
                        setScannerState({...scannerState, active: false});
                    }}
                    initialMode={ScanMode.ADD_TO_BINDER}
                />
                <button 
                    onClick={() => setScannerState({...scannerState, active: false})}
                    className="absolute top-4 right-4 z-[160] p-3 bg-black/50 text-white rounded-full backdrop-blur-md border border-white/10"
                >
                    <Icons.Close size={24} />
                </button>
            </div>
        )}

        {/* --- Top Bar (Tabs) --- */}
        <div className="absolute top-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
            <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-1 rounded-full flex gap-1 shadow-2xl pointer-events-auto">
                <button 
                    onClick={() => setActiveTab('desk')}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'desk' ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    <Icons.Grid size={14} />
                    <span>Desk</span>
                </button>
                <button 
                    onClick={() => setActiveTab('flea')}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'flea' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    <Icons.ShoppingBag size={14} />
                    <span>Flea</span>
                </button>
            </div>
        </div>

        {/* --- Content Area --- */}
        <div className="flex-1 relative overflow-hidden flex bg-[#09090b]">
            
            {activeTab === 'desk' ? (
                /* ============ THE OBSIDIAN DESK ============ */
                <>
                    {/* Desktop Left Panel - Collapsible */}
                    <div className={`hidden lg:flex transition-all duration-500 border-r border-white/5 z-20 bg-[#020617] ${isMyBinderOpen ? 'w-80' : 'w-0 overflow-hidden opacity-0'}`}>
                        <div className="w-80 h-full">
                            {renderInventoryPanel('My Binder', myInventory, 'my', mySearch, setMySearch)}
                        </div>
                    </div>

                    {/* Center Stage: The Desk */}
                    <div className="flex-1 relative flex flex-col items-center justify-center p-0 md:p-8 overflow-hidden bg-[#09090b]">
                        
                        {/* Lighting Effect */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03),_transparent_70%)] pointer-events-none"></div>

                        {/* Mobile Panel Overlays (Slide Up/In) */}
                        <div className={`lg:hidden absolute inset-0 z-30 transition-transform duration-300 ${mobileTradeTab === 'my' ? 'translate-y-0' : 'translate-y-full'}`}>
                             {/* Back Button for Mobile Panel */}
                             <div className="absolute top-4 left-4 z-50">
                                <button onClick={() => setMobileTradeTab('mat')} className="p-2 bg-white/10 rounded-full text-white"><Icons.ChevronDown /></button>
                             </div>
                             {renderInventoryPanel('My Binder', myInventory, 'my', mySearch, setMySearch, "bg-gradient-to-b from-[#1a1510] to-[#020617]")}
                        </div>
                        <div className={`lg:hidden absolute inset-0 z-30 transition-transform duration-300 ${mobileTradeTab === 'their' ? 'translate-y-0' : 'translate-y-full'}`}>
                             <div className="absolute top-4 left-4 z-50">
                                <button onClick={() => setMobileTradeTab('mat')} className="p-2 bg-white/10 rounded-full text-white"><Icons.ChevronDown /></button>
                             </div>
                             {renderInventoryPanel('Their Binder', theirInventory, 'their', theirSearch, setTheirSearch, "bg-gradient-to-b from-[#0f172a] to-[#020617]")}
                        </div>

                        {/* The Desk Mat */}
                        <div className={`relative w-full h-full md:max-w-5xl md:h-[80%] bg-[#1e293b] md:rounded-[2rem] flex flex-col md:flex-row overflow-hidden transition-all duration-700
                            ${!hasItems 
                                ? 'border border-white/5 ring-1 ring-white/5 shadow-2xl' 
                                : isBalanced 
                                    ? 'border border-emerald-500/30 ring-1 ring-emerald-500/30 shadow-[0_0_50px_-10px_rgba(16,185,129,0.15)]' 
                                    : 'border border-amber-500/30 ring-1 ring-amber-500/30 shadow-[0_0_50px_-10px_rgba(245,158,11,0.15)]'
                            }
                        `}>
                            
                            {/* Texture Overlay for Mat */}
                            <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/leather.png')] pointer-events-none mix-blend-overlay"></div>

                            {/* Zone 1: Counterparty (Top on Mobile, Right on Desktop) */}
                            <div 
                                className="flex-1 relative flex flex-col group/zone transition-colors hover:bg-white/[0.01] order-1 md:order-2 border-b md:border-b-0 md:border-l border-white/5"
                                onClick={() => { if(window.innerWidth < 1024) setMobileTradeTab('their') }} 
                            >
                                <div className="absolute top-6 right-6 md:left-6 md:right-auto text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 pointer-events-none z-20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover/zone:bg-blue-500 transition-colors"></div>
                                    Them
                                </div>
                                
                                <div className="flex-1 flex flex-wrap justify-center content-start gap-4 overflow-y-auto no-scrollbar p-6 pt-20 pb-20 z-10">
                                    {theirOffer.length === 0 ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-2 opacity-30">
                                            <Icons.Plus size={32} strokeWidth={1} />
                                            <span>Add Cards</span>
                                        </div>
                                    ) : (
                                        theirOffer.map(c => renderActiveCard(c, 'their'))
                                    )}
                                </div>
                                
                                <div className="absolute bottom-6 right-6 text-right pointer-events-none z-20">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Value</p>
                                    <p className="text-2xl font-mono font-bold text-slate-300 tracking-tight">{formatCurrency(theirTotal, currency)}</p>
                                </div>
                            </div>

                            {/* Center Divider / Visual Scale Core */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center w-72 pointer-events-none">
                                
                                {/* Status Text */}
                                <div className={`mb-3 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-md transition-all duration-300 pointer-events-auto
                                    ${!hasItems ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
                                    ${isBalanced 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                        : netGain < 0 
                                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                    }
                                `}>
                                    {!hasItems ? 'Add Cards' : isBalanced ? 'Fair Trade' : netGain < 0 ? 'You are overpaying' : 'You are underpaying'}
                                </div>

                                <div className="relative w-full h-12 flex items-center justify-center pointer-events-auto">
                                    {/* The Track */}
                                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-[#0f172a] rounded-full overflow-hidden border border-white/10 shadow-inner">
                                        {/* Safe Zone Indicator */}
                                        <div 
                                            className="absolute top-0 bottom-0 bg-white/10 transition-all duration-300"
                                            style={{ 
                                                left: '50%', 
                                                transform: 'translateX(-50%)',
                                                width: `${Math.max(slippage * 2, 4)}%` 
                                            }}
                                        ></div>
                                        
                                        {/* Center Marker */}
                                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 -translate-x-1/2"></div>
                                    </div>

                                    {/* The Sliding Badge */}
                                    <button 
                                        onClick={() => setShowSettings(true)}
                                        style={{ transform: `translateX(${slideOffset * 1.5}px)` }}
                                        className={`
                                            absolute transition-all duration-500 ease-spring
                                            flex flex-col items-center justify-center min-w-[90px] h-12 px-4 rounded-xl border shadow-2xl cursor-pointer group hover:scale-105 active:scale-95
                                            ${!hasItems
                                                ? 'bg-[#0f172a] border-white/10 text-slate-400'
                                                : isBalanced
                                                    ? 'bg-emerald-900/90 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                                    : netGain < 0
                                                        ? 'bg-rose-900/90 text-rose-400 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                                                        : 'bg-indigo-900/90 text-indigo-400 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                            }
                                        `}
                                        title="Configure Slippage Tolerance"
                                    >
                                        <div className="text-sm font-bold font-mono tracking-tight whitespace-nowrap flex items-center gap-1">
                                            {!hasItems ? '0.00' : netGain === 0 
                                                ? 'EVEN' 
                                                : netGain > 0 
                                                    ? `+${formatCurrency(netGain, currency)}` 
                                                    : `-${formatCurrency(Math.abs(netGain), currency)}`
                                            }
                                        </div>
                                        <div className="text-[8px] uppercase tracking-wider opacity-70 flex items-center gap-1">
                                            <span>Diff</span>
                                            <Icons.Settings size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Zone 2: My Offer (Bottom on Mobile, Left on Desktop) */}
                            <div 
                                className="flex-1 relative flex flex-col group/zone transition-colors hover:bg-white/[0.01] order-2 md:order-1"
                                onClick={() => { if(window.innerWidth < 1024) setMobileTradeTab('my') }}
                            >
                                <div className="absolute top-6 left-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 pointer-events-none z-20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover/zone:bg-umber transition-colors"></div>
                                    You
                                </div>

                                <div className="flex-1 flex flex-wrap justify-center content-start gap-4 overflow-y-auto no-scrollbar p-6 pt-20 pb-20 z-10">
                                    {myOffer.length === 0 ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-sm font-medium gap-2 opacity-30">
                                            <Icons.Plus size={32} strokeWidth={1} />
                                            <span>Add Cards</span>
                                        </div>
                                    ) : (
                                        myOffer.map(c => renderActiveCard(c, 'my'))
                                    )}
                                </div>

                                <div className="absolute top-6 right-6 md:top-auto md:bottom-6 md:left-6 md:right-auto text-right md:text-left pointer-events-none z-20">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Value</p>
                                    <p className="text-2xl font-mono font-bold text-umber tracking-tight">{formatCurrency(myTotal, currency)}</p>
                                </div>
                            </div>

                        </div>

                        {/* Mobile Controls (Floating Segmented Control) */}
                        <div className="lg:hidden absolute bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
                             <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-2xl pointer-events-auto flex gap-1 transition-all duration-300">
                                 <button 
                                    onClick={() => setMobileTradeTab(mobileTradeTab === 'my' ? 'mat' : 'my')}
                                    className={`px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-2 duration-300
                                        ${mobileTradeTab === 'my' 
                                            ? 'bg-umber text-midnight shadow-[0_0_20px_rgba(199,167,123,0.4)] scale-105' 
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'}
                                    `}
                                 >
                                     <Icons.Binder size={14} /> My Binder
                                 </button>
                                 
                                 <div className="w-px bg-white/10 my-2"></div>
                                 
                                 <button 
                                    onClick={() => setMobileTradeTab(mobileTradeTab === 'their' ? 'mat' : 'their')}
                                    className={`px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-2 duration-300
                                        ${mobileTradeTab === 'their' 
                                            ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-105' 
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'}
                                    `}
                                 >
                                     Their Binder <Icons.Binder size={14} />
                                 </button>
                             </div>
                        </div>

                        {/* Desktop Controls (Bottom Right Actions) */}
                        <div className="absolute bottom-8 right-8 hidden lg:flex gap-3">
                             {(myOffer.length > 0 || theirOffer.length > 0) && (
                                <>
                                    <button 
                                        onClick={() => { setMyOffer([]); setTheirOffer([]); }}
                                        className="p-4 rounded-xl bg-[#0f172a] border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors shadow-lg flex items-center justify-center"
                                    >
                                        <Icons.Trash2 size={20} />
                                    </button>
                                    <button 
                                        onClick={handleConfirmTrade}
                                        className={`px-8 py-4 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 border
                                            ${isBalanced 
                                                ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500' 
                                                : 'bg-white text-black border-white hover:bg-slate-200'}
                                        `}
                                    >
                                        <Icons.CheckCircle size={20} />
                                        Confirm Deal
                                    </button>
                                </>
                             )}
                        </div>

                        {/* Desktop Side Toggles */}
                        <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-4 z-20">
                             <button 
                                onClick={() => setIsMyBinderOpen(!isMyBinderOpen)}
                                className={`p-3 rounded-full border transition-all shadow-lg flex items-center justify-center ${!isMyBinderOpen ? 'bg-white/10 text-white border-white/20' : 'bg-[#0f172a] text-slate-500 border-white/5 hover:text-white'}`}
                             >
                                 <Icons.List size={18} />
                             </button>
                        </div>
                        <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 right-4 z-20">
                             <button 
                                onClick={() => setIsTheirBinderOpen(!isTheirBinderOpen)}
                                className={`p-3 rounded-full border transition-all shadow-lg flex items-center justify-center ${!isTheirBinderOpen ? 'bg-white/10 text-white border-white/20' : 'bg-[#0f172a] text-slate-500 border-white/5 hover:text-white'}`}
                             >
                                 <Icons.List size={18} />
                             </button>
                        </div>

                    </div>

                    {/* Desktop Right Panel - Collapsible */}
                    <div className={`hidden lg:flex transition-all duration-500 border-l border-white/5 z-20 bg-[#020617] ${isTheirBinderOpen ? 'w-80' : 'w-0 overflow-hidden opacity-0'}`}>
                        <div className="w-80 h-full">
                            {renderInventoryPanel('Their Binder', theirInventory, 'their', theirSearch, setTheirSearch)}
                        </div>
                    </div>
                </>
            ) : (
                /* ============ FLEA MARKET ============ */
                <div className="absolute inset-0 overflow-y-auto no-scrollbar p-4 lg:p-8 pt-24 animate-fade-in-up bg-[#09090b]">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Flea Market Sessions</h1>
                                <p className="text-sm text-slate-400 max-w-md">Track real-time value during your hunts. Scan piles, calculate totals, and save session history.</p>
                            </div>
                            <button 
                                onClick={onStartSession}
                                className="w-full md:w-auto px-8 py-4 bg-amber-500 text-black font-bold rounded-2xl shadow-lg hover:bg-amber-400 transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95"
                            >
                                <Icons.Scan size={20} strokeWidth={2.5} />
                                <span>Start Live Session</span>
                            </button>
                        </div>

                        {fleaSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                                <div className="w-24 h-24 bg-amber-500/5 rounded-full flex items-center justify-center text-amber-500 mb-6 border border-amber-500/10">
                                    <Icons.ShoppingBag size={40} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Ready to Hunt?</h3>
                                <p className="text-sm text-slate-500 max-w-xs text-center mb-8">Your session history is empty. Start scanning at your next card show or shop visit.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {fleaSessions.map((session) => (
                                    <div key={session.id} className="bg-[#1e293b] border border-white/5 rounded-3xl p-6 hover:border-amber-500/30 hover:bg-white/[0.02] transition-all group cursor-pointer relative overflow-hidden shadow-lg">
                                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity duration-500 transform translate-x-4 -translate-y-4">
                                            <Icons.ShoppingBag size={80} className="text-amber-500" />
                                        </div>
                                        
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
                                                <Icons.ShoppingBag size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">{new Date(session.date).toLocaleDateString()}</span>
                                        </div>
                                        
                                        <h3 className="font-bold text-white text-lg mb-2 truncate pr-4">{session.name}</h3>
                                        <p className="text-xs text-slate-400 mb-6 line-clamp-2 h-8">{session.note || "No notes added."}</p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total Value</p>
                                                <p className="text-xl font-mono font-bold text-emerald-400">{formatCurrency(session.totalValue, currency)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Items</p>
                                                <p className="text-xl font-mono font-bold text-white">{session.cards.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
