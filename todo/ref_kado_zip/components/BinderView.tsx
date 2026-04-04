
import React, { useState, useMemo, useEffect } from 'react';
import { Card, ViewSettings, SortOption, SortDirection, GroupOption, Currency, CardLanguage, BinderGroupDef, BinderViewProps } from '../types';
import { Icons } from './Icons';
import { FiltersModal } from './FiltersModal';
import { ManageListsModal } from './ManageListsModal';
import { convertPrice, formatCurrency } from '../services/mockDataService';

interface ExtendedBinderViewProps extends BinderViewProps {
    // onOpenImport removed
}

export const BinderView: React.FC<ExtendedBinderViewProps> = ({ 
  cards, 
  currency = Currency.USD, 
  setCurrency = () => {},
  onCardClick,
  onUpdateCards,
  onSelectionModeChange,
  isPureView = false,
  onPureViewToggle,
  onStartScanning,
}) => {
  const [filter, setFilter] = useState('');
  const [activeGroupId, setActiveGroupId] = useState<string>('active-all');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isListDropdownOpen, setIsListDropdownOpen] = useState(false);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Sync selection mode with parent
  useEffect(() => {
    if (onSelectionModeChange) {
      onSelectionModeChange(isSelectionMode);
    }
  }, [isSelectionMode, onSelectionModeChange]);

  // Handle Escape Key for Pure View
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPureView && e.key === 'Escape') {
        if (onPureViewToggle) onPureViewToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPureView, onPureViewToggle]);

  // Dynamic Groups State
  const [groups, setGroups] = useState<BinderGroupDef[]>(() => {
    const saved = localStorage.getItem('binderGroups');
    return saved ? JSON.parse(saved) : [
      { id: 'trade', label: 'Trade Binder', icon: 'Trade' },
      { id: 'favorites', label: 'Favorites', icon: 'Star' },
      { id: 'grading', label: 'Grading Pile', icon: 'Layers' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('binderGroups', JSON.stringify(groups));
  }, [groups]);

  // Reset states when exiting selection mode
  useEffect(() => {
      if (!isSelectionMode) {
          setIsConfirmingDelete(false);
          setShowGroupSelector(false);
          setShowTagInput(false);
          setNewTagInput('');
      }
  }, [isSelectionMode]);

  // Central View Settings State - Defaulting to Value Descending
  const [settings, setSettings] = useState<ViewSettings>({
    viewMode: 'grid',
    gridZoom: 3,
    sortBy: SortOption.VALUE,
    sortDirection: SortDirection.DESC,
    groupBy: GroupOption.NONE,
    visibleLanguages: Object.values(CardLanguage),
  });

  // Portfolio Calculations
  const stats = useMemo(() => {
    const totalValue = cards.reduce((acc, curr) => acc + convertPrice(curr.price, currency) * (curr.quantity || 1), 0);
    // Approximate change calculation based on unit price day change
    const totalChange = cards.reduce((acc, curr) => acc + convertPrice(curr.usDayChange || 0, currency) * (curr.quantity || 1), 0);
    const uniqueCount = new Set(cards.map(c => `${c.name}:${c.set}:${c.number}`)).size;
    return { totalValue, totalChange, uniqueCount };
  }, [cards, currency]);

  // Collect all unique tags
  const allTags = useMemo(() => {
      const tags = new Set<string>();
      cards.forEach(c => c.tags?.forEach(t => tags.add(t)));
      return Array.from(tags).sort();
  }, [cards]);

  // Filtering, Sorting, and Grouping Logic
  const processedCards = useMemo(() => {
    const searchLower = filter.toLowerCase();
    let result = cards.filter(c => 
      (
        c.name.toLowerCase().includes(searchLower) || 
        c.set.toLowerCase().includes(searchLower) ||
        (c.tags && c.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      ) &&
      (c.language ? settings.visibleLanguages.includes(c.language) : true)
    );

    if (activeGroupId !== 'active-all') {
      result = result.filter(c => c.customGroups?.includes(activeGroupId));
    }

    if (activeTagFilter) {
        result = result.filter(c => c.tags?.includes(activeTagFilter));
    }

    result.sort((a, b) => {
      let valA: any = a[settings.sortBy as keyof Card];
      let valB: any = b[settings.sortBy as keyof Card];

      if (settings.sortBy === SortOption.VALUE) {
        valA = a.price;
        valB = b.price;
      } else if (settings.sortBy === SortOption.RARITY) {
         valA = a.rarity || '';
         valB = b.rarity || '';
      } else if (settings.sortBy === SortOption.RELEASE_DATE) {
         valA = a.releaseDate || '';
         valB = b.releaseDate || '';
      } else if (settings.sortBy === SortOption.CARD_NUMBER) {
         valA = a.number || '';
         valB = b.number || '';
      } else if (settings.sortBy === SortOption.TAGS) {
         // Sort by existence of tags first, then first tag alphabet
         valA = (a.tags && a.tags.length > 0) ? a.tags[0].toLowerCase() : 'zzzz';
         valB = (b.tags && b.tags.length > 0) ? b.tags[0].toLowerCase() : 'zzzz';
      }

      if (valA < valB) return settings.sortDirection === SortDirection.ASC ? -1 : 1;
      if (valA > valB) return settings.sortDirection === SortDirection.ASC ? 1 : -1;
      return 0;
    });

    return result;
  }, [cards, filter, activeGroupId, activeTagFilter, settings]);

  const groupedCards = useMemo<Record<string, Card[]>>(() => {
    if (settings.groupBy === GroupOption.NONE) return { 'All': processedCards };

    return processedCards.reduce((groups, card) => {
      let key = 'Other';
      if (settings.groupBy === GroupOption.GAME) key = card.game || 'Other';
      if (settings.groupBy === GroupOption.SET) key = card.set || 'Unknown Set';
      if (settings.groupBy === GroupOption.RARITY) key = card.rarity || 'Unknown Rarity';

      if (!groups[key]) groups[key] = [];
      groups[key].push(card);
      return groups;
    }, {} as Record<string, Card[]>);
  }, [processedCards, settings.groupBy]);

  // Helper to aggregate grouped cards into stacks (for Grid View)
  const aggregateCards = (cardList: Card[]) => {
      const map = new Map<string, Card[]>();
      cardList.forEach(c => {
          // Identity based on Name + Set + Number
          const key = `${c.name}|${c.set}|${c.number}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)?.push(c);
      });
      return Array.from(map.values());
  };

  // --- Bulk Action Handlers ---

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set()); // Clear selection on toggle
    setShowGroupSelector(false);
    setShowTagInput(false);
  };

  const handleCardInteract = (card: Card, stackIds?: string[]) => {
    if (isSelectionMode && !isPureView) {
      const newSet = new Set(selectedIds);
      
      // If stackIds is provided (Grid View), select/deselect all in stack
      const idsToToggle = stackIds || [card.id];
      
      // Check if the representative card (or first in stack) is selected to determine action
      const isSelected = newSet.has(card.id);
      
      idsToToggle.forEach(id => {
          if (isSelected) newSet.delete(id);
          else newSet.add(id);
      });

      setSelectedIds(newSet);
      setIsConfirmingDelete(false);
    } else if (!isPureView) {
      onCardClick?.(card);
    }
  };

  const executeBulkDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onUpdateCards) return;
    const newCards = cards.filter(c => !selectedIds.has(c.id));
    onUpdateCards(newCards);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setIsConfirmingDelete(false);
  };

  const handleBulkQuantity = (delta: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onUpdateCards) return;
    const newCards = cards.map(c => {
      if (selectedIds.has(c.id)) {
        const newQty = (c.quantity || 1) + delta;
        return { ...c, quantity: Math.max(1, newQty) };
      }
      return c;
    });
    onUpdateCards(newCards);
  };

  const handleBulkAddToGroup = (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onUpdateCards) return;
    const newCards = cards.map(c => {
      if (selectedIds.has(c.id)) {
        const currentGroups = c.customGroups || [];
        if (!currentGroups.includes(groupId)) {
          return { ...c, customGroups: [...currentGroups, groupId] };
        }
      }
      return c;
    });
    onUpdateCards(newCards);
    setShowGroupSelector(false);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkAddTag = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!newTagInput.trim() || !onUpdateCards) return;
      
      const newCards = cards.map(c => {
          if (selectedIds.has(c.id)) {
              const currentTags = c.tags || [];
              if (!currentTags.includes(newTagInput.trim())) {
                  return { ...c, tags: [...currentTags, newTagInput.trim()] };
              }
          }
          return c;
      });
      onUpdateCards(newCards);
      setShowTagInput(false);
      setNewTagInput('');
      setSelectedIds(new Set());
      setIsSelectionMode(false);
  };
  
  const selectAll = () => {
    const allIds = new Set(processedCards.map(c => c.id));
    if (allIds.size === selectedIds.size) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(allIds);
    }
  };

  // --- Render Helpers ---

  const getGridClass = () => {
    switch (settings.gridZoom) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5';
      case 4: return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6';
      case 5: return 'grid-cols-5 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8';
      default: return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5';
    }
  };

  const gapClass = settings.gridZoom >= 4 ? 'gap-1 md:gap-2' : 'gap-3 md:gap-4';

  const handleGroupClick = (groupId: string) => {
    if (navigator.vibrate) navigator.vibrate(20);
    setActiveGroupId(groupId);
  };

  const renderListSelector = () => {
    // Combine default 'active-all' with custom groups
    const allItems = [{ id: 'active-all', label: 'All Cards', icon: 'Binder' }, ...groups];
    const activeItem = allItems.find(i => i.id === activeGroupId) || allItems[0];
    
    const DropdownUI = ({ className = '' }: { className?: string }) => {
       const ActiveIcon = activeItem.icon && Icons[activeItem.icon as keyof typeof Icons] ? Icons[activeItem.icon as keyof typeof Icons] : Icons.Binder;
       return (
         <div className={`relative shrink-0 w-full md:w-auto md:mr-2 ${className}`}>
            {isListDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsListDropdownOpen(false)}></div>
            )}
            
            <button
              onClick={() => setIsListDropdownOpen(!isListDropdownOpen)}
              className="flex items-center justify-between gap-2 w-full md:min-w-[160px] px-4 py-2 bg-midnight/50 border border-white/10 rounded-xl text-sm font-bold text-light-slate hover:bg-white/5 transition-all shadow-inner group"
            >
              <div className="flex items-center gap-2 truncate">
                  <span className="text-umber shrink-0">
                    <ActiveIcon size={14} />
                  </span>
                  <span className="truncate">{activeItem.label}</span>
              </div>
              <Icons.ChevronDown size={14} className={`text-slate-text transition-transform shrink-0 ${isListDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isListDropdownOpen && (
               <div className="absolute top-full left-0 mt-2 w-full md:w-64 bg-navy border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up py-1">
                  <div className="max-h-64 overflow-y-auto no-scrollbar p-1 space-y-0.5">
                     {allItems.map(item => {
                        const ItemIcon = item.icon && Icons[item.icon as keyof typeof Icons] ? Icons[item.icon as keyof typeof Icons] : Icons.Binder;
                        return (
                            <button
                            key={item.id}
                            onClick={() => {
                                handleGroupClick(item.id);
                                setIsListDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between group
                                ${activeGroupId === item.id ? 'bg-umber text-midnight' : 'text-slate-text hover:text-light-slate hover:bg-white/5'}
                            `}
                            >
                            <div className="flex items-center gap-3">
                                <span className={activeGroupId === item.id ? 'text-midnight' : 'text-umber'}>
                                    <ItemIcon size={14} />
                                </span>
                                <span>{item.label}</span>
                            </div>
                            {activeGroupId === item.id && <Icons.Check size={14} />}
                            </button>
                        );
                     })}
                  </div>
                  <div className="border-t border-white/5 mt-1 pt-1 p-2 bg-midnight/30">
                      <button
                        onClick={() => { setIsManageOpen(true); setIsListDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-text hover:text-light-slate rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Icons.Settings size={14} />
                        <span>Manage Lists</span>
                      </button>
                  </div>
               </div>
            )}
         </div>
       );
    };

    const PillsUI = ({ className = '' }: { className?: string }) => (
        <div className={`flex bg-midnight/50 rounded-xl p-1 border border-white/10 shadow-inner shrink-0 mr-2 overflow-x-auto no-scrollbar max-w-2xl items-center ${className}`}>
            <button 
                onClick={() => handleGroupClick('active-all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeGroupId === 'active-all' ? 'bg-umber text-midnight shadow-sm' : 'text-slate-text hover:text-light-slate hover:bg-white/5'}`}
            >
                All Cards
            </button>
            {groups.map(group => (
                <button 
                    key={group.id}
                    onClick={() => handleGroupClick(group.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeGroupId === group.id ? 'bg-umber text-midnight shadow-sm' : 'text-slate-text hover:text-light-slate hover:bg-white/5'}`}
                >
                    {group.label}
                </button>
            ))}
            <div className="w-px h-4 bg-white/10 mx-1 self-center"></div>
            <button 
                onClick={() => setIsManageOpen(true)}
                className="px-2 py-1.5 rounded-lg text-slate-text hover:text-umber hover:bg-white/5 transition-all"
                title="Manage Lists"
            >
                <Icons.Settings size={14} />
            </button>
        </div>
    );

    // Render Dropdown on Mobile (default), Pills on Desktop
    return (
        <>
            <DropdownUI className="block xl:hidden" />
            <PillsUI className="hidden xl:flex" />
        </>
    );
  };

  const getShimmerColor = (rarity: string) => {
    const r = rarity.toLowerCase();
    if (r.includes('ultra') || r.includes('secret') || r.includes('hyper') || r.includes('illustration')) {
      return 'rgba(255, 215, 0, 0.6)'; // Gold
    }
    if (r.includes('rare') || r.includes('holo')) {
      return 'rgba(229, 228, 226, 0.6)'; // Silver/Platinum
    }
    return 'rgba(205, 127, 50, 0.5)'; // Bronze
  };

  const renderGridCard = (stack: Card[]) => {
      const card = stack[0]; // Representative card
      const totalQty = stack.reduce((acc, c) => acc + (c.quantity || 1), 0);
      const stackIds = stack.map(c => c.id);
      
      const isSelected = selectedIds.has(card.id); // Use representative for check
      const isDimmed = isSelectionMode && !isSelected;
      const isHighDensity = settings.gridZoom >= 4;
      const showText = settings.gridZoom < 5 && !isPureView;
      const displayPrice = formatCurrency(convertPrice(card.price, currency), currency);
      const isNew = stack.some(c => c.isNew);

      // Collect all tags from the stack
      const stackTags = Array.from(new Set(stack.flatMap(c => c.tags || [])));

      // --- Badge Logic ---
      // Condition Badge
      const conditions = new Set(stack.map(c => c.condition || 'NM'));
      const isMixedCondition = conditions.size > 1;
      const conditionLabel = isMixedCondition ? '±' : (Array.from(conditions)[0] || 'NM');
      const conditionColor = isMixedCondition
        ? 'text-light-slate bg-navy/90 border-white/10'
        : (conditionLabel === 'NM' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' 
        : conditionLabel === 'LP' ? 'text-emerald-200 bg-emerald-200/10 border-emerald-200/20'
        : conditionLabel === 'MP' ? 'text-amber-200 bg-amber-200/10 border-amber-200/20'
        : 'text-rose-400 bg-rose-400/10 border-rose-400/20');

      // Variant Badge
      const finishes = new Set(stack.map(c => c.finish || 'Normal'));
      const isMixedVariant = finishes.size > 1;
      const primaryFinish = Array.from(finishes)[0];
      
      const VariantBadge = () => {
          if (isMixedVariant) return <span className="font-bold font-serif italic">V</span>;
          if (primaryFinish === 'Foil') return <Icons.Zap size={10} fill="currentColor" />;
          if (primaryFinish === 'Reverse Holo') return <span className="text-[8px] font-bold">RH</span>;
          if (primaryFinish === 'Etched') return <Icons.Star size={10} fill="currentColor" />;
          return null; // Normal -> No badge
      };

      const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isSelectionMode && !isPureView) {
            if (navigator.vibrate) navigator.vibrate(50);
            setIsSelectionMode(true);
            setSelectedIds(new Set(stackIds));
        }
      };

      return (
        <div 
            key={card.id}
            onClick={() => handleCardInteract(card, stackIds)}
            onContextMenu={handleContextMenu}
            className={`
                backdrop-blur-sm border 
                ${isHighDensity ? 'p-1 rounded-sm' : 'p-1.5 md:p-2 rounded-md'}
                shadow-soft-lg active:scale-[0.98] transition-all duration-200 
                group relative overflow-hidden flex flex-col cursor-pointer
                ${isSelected 
                    ? 'bg-umber/10 border-umber ring-2 ring-umber scale-95 shadow-[0_0_15px_rgba(199,167,123,0.3)] z-10' 
                    : isDimmed 
                        ? 'bg-navy/20 border-white/5 opacity-60 scale-[0.95]' 
                        : isPureView 
                        ? 'border-transparent hover:border-white/10 hover:shadow-xl'
                        : 'bg-navy/40 border-white/5 hover:border-umber/20'}
            `}
        >
            <div 
                className={`
                    aspect-[5/7] bg-midnight rounded-sm overflow-hidden relative shadow-inner w-full
                    ${showText ? 'mb-2' : 'mb-0'} card-thumbnail ${isNew ? 'is-new' : ''}
                `}
                style={isNew ? { '--shimmer-color': getShimmerColor(card.rarity) } as React.CSSProperties : {}}
            >
                <img 
                    src={card.imageUrl} 
                    alt={card.name} 
                    className={`w-full h-full object-cover transition-all duration-300 ${isSelected ? 'opacity-100' : isDimmed ? 'opacity-70 grayscale-[0.7]' : 'opacity-90 group-hover:opacity-100'}`} 
                    loading="lazy" 
                />
                
                {/* --- VISUAL BADGES --- */}
                {!isSelectionMode && !isPureView && (
                    <>
                        {/* 1. Quantity (Top Left) */}
                        <div className="absolute top-1.5 left-1.5 z-20">
                            <div className="bg-midnight/80 backdrop-blur-md border border-white/10 text-light-slate text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg min-w-[20px] text-center">
                                x{totalQty}
                            </div>
                        </div>

                        {/* 2. Condition (Bottom Left) */}
                        <div className="absolute bottom-1.5 left-1.5 z-20">
                            <div className={`backdrop-blur-md border px-1.5 py-0.5 rounded text-[8px] font-bold shadow-lg ${conditionColor} uppercase tracking-wider`}>
                                {conditionLabel}
                            </div>
                        </div>

                        {/* 3. Variant (Bottom Right) */}
                        {(isMixedVariant || primaryFinish !== 'Normal') && (
                            <div className="absolute bottom-1.5 right-1.5 z-20">
                                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 backdrop-blur-md flex items-center justify-center shadow-lg">
                                    <VariantBadge />
                                </div>
                            </div>
                        )}

                        {/* 4. Tag Indicator (Top Right) */}
                        {stackTags.length > 0 && (
                            <div className="absolute top-1.5 right-1.5 z-20">
                                <div className="bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-300 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg max-w-[50px] truncate">
                                    {stackTags[0]}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Selection Overlay */}
                {isSelectionMode && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20">
                        {isSelected && (
                            <div className="w-10 h-10 bg-umber rounded-full flex items-center justify-center shadow-lg animate-fade-in-up">
                                <Icons.Check size={20} className="text-midnight stroke-[4px]" />
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {showText && (
                <div className="space-y-0.5 px-1">
                    <h3 className={`font-bold text-[10px] md:text-xs truncate transition-colors ${isSelected ? 'text-umber' : 'text-light-slate'}`}>{card.name}</h3>
                    <div className="flex justify-between items-center">
                        <p className="text-[9px] text-slate-text truncate w-12 uppercase tracking-wide font-medium">{card.set}</p>
                        <p className="text-[10px] md:text-xs font-bold text-umber">{displayPrice}</p>
                    </div>
                </div>
            )}
        </div>
      );
  };

  const renderListCard = (card: Card) => {
    const displayPrice = formatCurrency(convertPrice(card.price, currency), currency);
    const isSelected = selectedIds.has(card.id);
    const isDimmed = isSelectionMode && !isSelected;
    
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isSelectionMode && !isPureView) {
            if (navigator.vibrate) navigator.vibrate(50);
            setIsSelectionMode(true);
            setSelectedIds(new Set([card.id]));
        }
    };
    
    return (
        <div 
            key={card.id} 
            onClick={() => handleCardInteract(card)}
            onContextMenu={handleContextMenu}
            className={`flex items-center gap-4 p-3 border rounded-2xl active:scale-[0.99] transition-all cursor-pointer group
              ${isSelected 
                ? 'bg-umber/10 border-umber shadow-[0_0_10px_rgba(199,167,123,0.2)]' 
                : isDimmed ? 'bg-navy/20 border-white/5 opacity-60' : 'bg-navy/40 border-white/5 hover:bg-navy/60'}
            `}
        >
            {isSelectionMode && (
               <div className={`shrink-0 transition-colors ${isSelected ? 'text-umber' : 'text-slate-text'}`}>
                 {isSelected ? <Icons.CheckSquare size={20} /> : <Icons.Square size={20} />}
               </div>
            )}
            <div className="w-12 h-16 bg-midnight rounded-md overflow-hidden shrink-0 border border-white/5 relative">
                <img src={card.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={card.name} loading="lazy" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-light-slate text-sm truncate">{card.name}</h3>
                    {(card.finish === 'Foil' || card.finish === 'Reverse Holo') && <Icons.Zap size={12} className="text-amber-400" fill="currentColor" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-text">
                    <span className="truncate">{card.set}</span>
                    <span>•</span>
                    <span className={`font-bold ${card.condition === 'NM' ? 'text-emerald-400' : 'text-slate-400'}`}>{card.condition || 'NM'}</span>
                </div>
                {card.tags && card.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                        {card.tags.map(tag => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20 font-bold">{tag}</span>
                        ))}
                    </div>
                )}
            </div>
            <div className="text-right">
                <p className="font-bold text-umber text-sm">{displayPrice}</p>
                <p className="text-left lg:text-right text-[10px] text-slate-text">Qty: {card.quantity || 1}</p>
            </div>
        </div>
    );
  };

  return (
    <div className={`h-full overflow-hidden flex flex-col pt-0 ${isPureView ? 'px-0 lg:pt-0 lg:pb-0' : 'px-0 md:px-8 md:pt-6 md:pb-6'} font-sans relative transition-all duration-500`}>
      
      {isPureView && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
            <button 
                onClick={onPureViewToggle}
                className="group flex items-center gap-3 p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white rounded-full shadow-lg border border-white/10 transition-all hover:scale-105 active:scale-95"
                title="Exit Pure View (Esc)"
            >
                <span className="hidden md:block text-xs font-bold text-slate-300 pl-2 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">Press Esc</span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Icons.Close size={18} />
                </div>
            </button>
        </div>
      )}

      <FiltersModal 
        isOpen={isFiltersOpen} 
        onClose={() => setIsFiltersOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        currency={currency}
        onUpdateCurrency={setCurrency}
        theme="default"
      />

      <ManageListsModal 
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        groups={groups}
        onUpdateGroups={setGroups}
      />

      <div className={`flex-1 h-full overflow-y-auto no-scrollbar`}>
          
          {!isPureView && (
            <header className="hidden md:flex items-end justify-between mb-6 mt-2">
                <div>
                    <h1 className="text-3xl font-bold text-light-slate tracking-tight mb-1">My Binder</h1>
                    <p className="text-slate-text text-sm flex items-center gap-2">
                        <span>{stats.uniqueCount} Unique Assets</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span>{processedCards.length} Total Cards</span>
                    </p>
                </div>
                <div className="flex gap-8 bg-navy/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                   <div>
                       <p className="text-[10px] font-bold text-slate-text uppercase tracking-wider mb-1">Portfolio Value</p>
                       <p className="text-2xl font-bold text-white font-mono">{formatCurrency(stats.totalValue, currency)}</p>
                   </div>
                   <div className="w-px bg-white/10"></div>
                   <div>
                       <p className="text-[10px] font-bold text-slate-text uppercase tracking-wider mb-1">7D Change</p>
                       <div className={`text-xl font-bold font-mono flex items-center gap-2 ${stats.totalChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stats.totalChange >= 0 ? <Icons.TrendingUp size={18} /> : <Icons.TrendingDown size={18} />}
                          {stats.totalChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(stats.totalChange), currency)}
                       </div>
                   </div>
                </div>
            </header>
          )}

          {/* Desktop/Tablet Filter Toolbar - Sticky below Header */}
          {/* Enabled on MD screens */}
          {!isPureView && (
             <div className="hidden md:flex items-center gap-3 mb-6 sticky top-0 z-30 bg-navy/80 border border-white/5 p-2 px-3 rounded-2xl backdrop-blur-xl animate-fade-in-up shadow-lg">
                  
                  {/* Lists / Groups Selector (Responsive) */}
                  {renderListSelector()}

                  {/* Search - Responsive min-width to fit on tablet */}
                  <div className="relative flex-1 min-w-[120px] lg:min-w-[200px]">
                      <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-text" size={16} />
                      <input 
                          type="text" 
                          placeholder="Search binder..." 
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          className="w-full bg-midnight/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-light-slate focus:outline-none focus:ring-1 focus:ring-umber transition-all placeholder-slate-text/50 shadow-inner"
                      />
                  </div>

                  {/* Tag Filter (If any tags exist) */}
                  {allTags.length > 0 && (
                      <div className="relative shrink-0">
                          <select
                              value={activeTagFilter || ''}
                              onChange={(e) => setActiveTagFilter(e.target.value || null)}
                              className={`appearance-none bg-midnight/50 border border-white/10 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-light-slate focus:outline-none cursor-pointer hover:bg-white/5 transition-colors ${activeTagFilter ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : ''}`}
                          >
                              <option value="">All Tags</option>
                              {allTags.map(tag => (
                                  <option key={tag} value={tag}>{tag}</option>
                              ))}
                          </select>
                          <Icons.ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-text pointer-events-none" />
                      </div>
                  )}

                  <div className="h-6 w-px bg-white/10 mx-1"></div>

                  {/* View Mode */}
                  <div className="flex bg-midnight/50 rounded-xl p-1 border border-white/10 shadow-inner shrink-0">
                      <button 
                          onClick={() => setSettings({...settings, viewMode: 'grid'})}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${settings.viewMode === 'grid' ? 'bg-umber text-midnight shadow-sm' : 'text-slate-text hover:text-light-slate hover:bg-white/5'}`}
                      >
                          <Icons.Grid size={14} /> 
                      </button>
                      <button 
                          onClick={() => setSettings({...settings, viewMode: 'list'})}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${settings.viewMode === 'list' ? 'bg-umber text-midnight shadow-sm' : 'text-slate-text hover:text-light-slate hover:bg-white/5'}`}
                      >
                          <Icons.List size={14} />
                      </button>
                  </div>

                  {/* Sort */}
                   <div className="flex items-center bg-midnight/50 border border-white/10 rounded-xl shadow-inner shrink-0">
                      <div className="relative">
                        <select 
                            value={settings.sortBy}
                            onChange={(e) => setSettings({...settings, sortBy: e.target.value as SortOption})}
                            className="appearance-none bg-transparent py-2 pl-4 pr-8 text-xs font-bold text-light-slate focus:outline-none cursor-pointer min-w-[100px] hover:text-white transition-colors"
                        >
                            <option value={SortOption.VALUE}>Value</option>
                            <option value={SortOption.DATE_ADDED}>Date Added</option>
                            <option value={SortOption.NAME}>Name</option>
                            <option value={SortOption.SET}>Set</option>
                            <option value={SortOption.RARITY}>Rarity</option>
                            <option value={SortOption.RELEASE_DATE}>Released</option>
                            <option value={SortOption.TAGS}>Tags</option>
                        </select>
                        <Icons.ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-text pointer-events-none" />
                      </div>
                      
                      <div className="w-px h-4 bg-white/10"></div>
                      
                      <button 
                        onClick={() => setSettings({...settings, sortDirection: settings.sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC})}
                        className="p-2 text-slate-text hover:text-umber hover:bg-white/5 transition-all rounded-r-xl"
                        title={settings.sortDirection === SortDirection.ASC ? "Ascending" : "Descending"}
                     >
                        {settings.sortDirection === SortDirection.ASC ? <Icons.ArrowUp size={14} /> : <Icons.ArrowDown size={14} />}
                     </button>
                   </div>
                   
                   {/* Spacer */}
                   <div className="flex-1"></div>

                    {/* Pure View Toggle */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPureViewToggle?.(); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-text hover:text-umber hover:bg-white/5 transition-all border border-transparent hover:border-white/10 shrink-0"
                      title="Enter Pure View"
                   >
                       <Icons.Maximize size={14} />
                       <span className="hidden xl:inline">Focus</span>
                   </button>
             </div>
          )}

          {!isPureView && (
            <div className="md:hidden px-4 pt-6">
                {!isSelectionMode && (
                  <div className="mb-6 relative animate-fade-in-up">
                    <div className="bg-navy/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-soft-lg flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-text text-xs font-bold uppercase tracking-wider mb-1">Portfolio Value</p>
                                <h1 className="text-4xl font-bold text-light-slate tracking-tight font-mono">{formatCurrency(stats.totalValue, currency)}</h1>
                            </div>
                        </div>
                        
                        <div className="h-px w-full bg-white/5"></div>

                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-slate-text text-[10px] font-bold uppercase tracking-wider mb-1">7D Change</p>
                                <div className={`text-lg font-bold font-mono flex items-center gap-1.5 ${stats.totalChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {stats.totalChange >= 0 ? <Icons.TrendingUp size={16} /> : <Icons.TrendingDown size={16} />}
                                    {stats.totalChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(stats.totalChange), currency)}
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div>
                                <p className="text-slate-text text-[10px] font-bold uppercase tracking-wider mb-1">Collection</p>
                                <div className="text-lg font-bold font-mono text-white">{processedCards.length}</div>
                            </div>
                        </div>
                    </div>
                  </div>
                )}
                
                {/* Mobile List Selector (Replaced Horizontal Scroll with Dropdown Component) */}
                <div className="mb-4 relative z-20">
                    {renderListSelector()}
                </div>

                {/* Mobile Control Bar */}
                <div className="flex gap-3 mb-4 overflow-x-auto no-scrollbar pb-2">
                    <button 
                        onClick={() => setIsFiltersOpen(true)}
                        className="flex-1 bg-navy border border-white/10 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-light-slate shadow-sm active:scale-95 transition-transform whitespace-nowrap"
                    >
                        <Icons.SlidersHorizontal size={18} />
                        <span>Filter & Sort</span>
                        {filter && <div className="w-2 h-2 bg-umber rounded-full"></div>}
                    </button>

                    <button 
                        onClick={() => setSettings(prev => ({...prev, viewMode: prev.viewMode === 'grid' ? 'list' : 'grid'}))}
                        className="bg-navy border border-white/10 w-12 rounded-xl flex items-center justify-center text-slate-text active:scale-95 transition-transform shrink-0"
                    >
                         {settings.viewMode === 'grid' ? <Icons.List size={20} /> : <Icons.Grid size={20} />}
                    </button>

                    <button 
                        onClick={() => onPureViewToggle?.()}
                        className="bg-navy border border-white/10 w-12 rounded-xl flex items-center justify-center text-slate-text active:scale-95 transition-transform shrink-0"
                        title="Clean View"
                    >
                        <Icons.Maximize size={20} />
                    </button>
                    
                    {!isSelectionMode ? (
                        <button 
                            onClick={toggleSelectionMode}
                            className="bg-navy border border-white/10 w-12 rounded-xl flex items-center justify-center text-slate-text active:scale-95 transition-transform shrink-0"
                        >
                            <Icons.CheckSquare size={20} />
                        </button>
                    ) : (
                        <button 
                            onClick={selectAll}
                            className="bg-navy border border-white/10 px-4 rounded-xl flex items-center justify-center text-xs font-bold text-slate-text active:scale-95 transition-transform whitespace-nowrap shrink-0"
                        >
                            {selectedIds.size === processedCards.length ? 'Deselect All' : 'Select All'}
                        </button>
                    )}
                </div>

                {/* Mobile Search */}
                <div className="mb-4 relative">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-text" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search binder..." 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-navy/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-light-slate focus:outline-none focus:ring-1 focus:ring-umber transition-all placeholder-slate-text/50"
                    />
                </div>
            </div>
          )}

          {/* Content Grid/List */}
          <div className={`pb-32 lg:pb-12 min-h-[50vh] ${isPureView ? 'px-4' : 'px-4 md:px-0'}`}>
             
             {/* Bulk Actions Bar (Mobile/Desktop) */}
             {isSelectionMode && (
                 <div className="sticky top-4 z-40 mb-4 animate-fade-in-up mx-auto max-w-2xl">
                     <div className="bg-navy/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center justify-between shadow-2xl ring-1 ring-white/5 relative">
                         <div className="flex items-center gap-3 px-3">
                             <button onClick={toggleSelectionMode} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-text hover:text-white transition-colors">
                                 <Icons.Close size={16} />
                             </button>
                             <span className="text-sm font-bold text-white">{selectedIds.size} Selected</span>
                         </div>
                         
                         <div className="flex items-center gap-1">
                             {showGroupSelector ? (
                                 <div className="flex items-center gap-1 animate-slide-up">
                                     {groups.map(g => (
                                         <button 
                                            key={g.id}
                                            onClick={(e) => handleBulkAddToGroup(g.id, e)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-umber text-slate-text hover:text-midnight transition-colors"
                                            title={`Add to ${g.label}`}
                                         >
                                             {Icons[g.icon as keyof typeof Icons] ? React.createElement(Icons[g.icon as keyof typeof Icons], {size: 16}) : <Icons.Binder size={16} />}
                                         </button>
                                     ))}
                                     <div className="w-px h-6 bg-white/10 mx-1"></div>
                                 </div>
                             ) : showTagInput ? (
                                <form onSubmit={handleBulkAddTag} className="flex items-center gap-1 animate-slide-left">
                                    <input 
                                        autoFocus
                                        type="text"
                                        placeholder="Enter tag..."
                                        value={newTagInput}
                                        onChange={(e) => setNewTagInput(e.target.value)}
                                        className="w-24 bg-midnight border border-white/10 rounded-lg py-1 px-2 text-xs text-white focus:outline-none focus:border-umber"
                                    />
                                    <button type="submit" className="p-1.5 bg-umber text-midnight rounded-lg">
                                        <Icons.Check size={14} />
                                    </button>
                                </form>
                             ) : (
                                 <>
                                    <button onClick={(e) => { e.stopPropagation(); setShowGroupSelector(true); }} className="p-2 rounded-lg text-slate-text hover:text-white hover:bg-white/10 transition-colors flex flex-col items-center gap-1">
                                        <Icons.FolderInput size={18} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setShowTagInput(true); }} className="p-2 rounded-lg text-slate-text hover:text-white hover:bg-white/10 transition-colors flex flex-col items-center gap-1">
                                        <Icons.Tag size={18} />
                                    </button>
                                    <button onClick={(e) => handleBulkQuantity(1, e)} className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-400/10 transition-colors flex flex-col items-center gap-1">
                                        <Icons.Plus size={18} />
                                    </button>
                                 </>
                             )}

                             {!isConfirmingDelete ? (
                                 <button onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }} className="p-2 rounded-lg text-rose-400 hover:bg-rose-400/10 transition-colors flex flex-col items-center gap-1">
                                     <Icons.Trash2 size={18} />
                                 </button>
                             ) : (
                                 <button onClick={executeBulkDelete} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors animate-pulse">
                                     Confirm
                                 </button>
                             )}
                         </div>
                     </div>
                 </div>
             )}

             {/* Empty State */}
             {Object.keys(groupedCards).length === 0 && (
                 <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
                     {cards.length === 0 ? (
                         // Total Empty State
                         <>
                             <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-6 relative group">
                                 <div className="absolute inset-0 bg-umber/5 rounded-full blur-xl group-hover:bg-umber/10 transition-colors"></div>
                                 <Icons.Layers size={40} className="text-umber opacity-80 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                                 <div className="absolute bottom-0 right-0 bg-navy border border-white/10 p-2 rounded-full shadow-lg">
                                     <Icons.Plus size={16} className="text-emerald-400" strokeWidth={3} />
                                 </div>
                             </div>
                             <h3 className="text-2xl font-bold text-light-slate mb-2 tracking-tight">Your binder is empty</h3>
                             <p className="text-sm text-slate-text max-w-xs mb-8 leading-relaxed">
                                 The journey of a thousand cards begins with a single scan. Start building your collection today.
                             </p>
                             {onStartScanning && (
                                 <button 
                                     onClick={onStartScanning}
                                     className="px-8 py-3.5 bg-umber text-midnight font-bold rounded-2xl shadow-[0_0_20px_rgba(199,167,123,0.2)] hover:bg-umber-dark hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                 >
                                     <Icons.Scan size={20} strokeWidth={2.5} />
                                     Scan First Card
                                 </button>
                             )}
                         </>
                     ) : (
                         // Filtered Empty State
                         <>
                             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                 <Icons.Search size={32} className="text-slate-500" strokeWidth={1.5} />
                             </div>
                             <h3 className="text-lg font-bold text-light-slate mb-1">No matches found</h3>
                             <p className="text-sm text-slate-text mb-6">We couldn't find any cards matching your current filters.</p>
                             <button 
                                 onClick={() => { setFilter(''); setActiveGroupId('active-all'); setActiveTagFilter(null); }}
                                 className="px-6 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                             >
                                 Clear Filters
                             </button>
                         </>
                     )}
                 </div>
             )}

             {/* Render Groups */}
             {Object.entries(groupedCards).map(([groupName, groupCards]: [string, Card[]]) => {
                 if (groupCards.length === 0) return null;
                 
                 // Only show headers if grouping is active
                 const showHeader = settings.groupBy !== GroupOption.NONE;
                 
                 return (
                    <div key={groupName} className="mb-8">
                        {showHeader && (
                            <div className="flex items-center gap-4 mb-4">
                                <h2 className="text-lg font-bold text-light-slate">{groupName}</h2>
                                <div className="h-px flex-1 bg-white/10"></div>
                                <span className="text-xs font-bold text-slate-text bg-white/5 px-2 py-1 rounded-md">{groupCards.length}</span>
                            </div>
                        )}
                        
                        <div className={`grid ${settings.viewMode === 'grid' ? getGridClass() : 'grid-cols-1'} ${gapClass}`}>
                            {settings.viewMode === 'grid' ? (
                                aggregateCards(groupCards).map(stack => renderGridCard(stack))
                            ) : (
                                groupCards.map(card => renderListCard(card))
                            )}
                        </div>
                    </div>
                 );
             })}
          </div>
      </div>
    </div>
  );
};
