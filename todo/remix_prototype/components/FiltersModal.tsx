
import React from 'react';
import { Icons } from './Icons';
import { 
  ViewSettings, 
  SortOption, 
  SortDirection, 
  GroupOption, 
  Currency, 
  CardLanguage 
} from '../types';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ViewSettings;
  onUpdateSettings: (settings: ViewSettings) => void;
  currency: Currency;
  onUpdateCurrency: (currency: Currency) => void;
  theme?: 'default' | 'flea' | 'market';
}

export const FiltersModal: React.FC<FiltersModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings,
  currency,
  onUpdateCurrency,
  theme = 'default'
}) => {
  if (!isOpen) return null;

  const activeColor = theme === 'flea' ? 'text-amber-500' : theme === 'market' ? 'text-emerald-400' : 'text-umber';
  const activeBg = theme === 'flea' ? 'bg-amber-500' : theme === 'market' ? 'bg-emerald-500' : 'bg-umber';
  const activeBorder = theme === 'flea' ? 'border-amber-500' : theme === 'market' ? 'border-emerald-500' : 'border-umber';

  const updateSetting = <K extends keyof ViewSettings>(key: K, value: ViewSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const toggleLanguage = (lang: CardLanguage) => {
    const current = settings.visibleLanguages;
    if (current.includes(lang)) {
      updateSetting('visibleLanguages', current.filter(l => l !== lang));
    } else {
      updateSetting('visibleLanguages', [...current, lang]);
    }
  };

  const getSortLabel = (opt: SortOption) => {
    switch(opt) {
      case SortOption.DATE_ADDED: return 'Date Added';
      case SortOption.VALUE: return 'Market Value';
      case SortOption.RARITY: return 'Rarity';
      case SortOption.NAME: return 'Card Name';
      case SortOption.SET: return 'Set Name';
      case SortOption.RELEASE_DATE: return 'Release Date';
      case SortOption.CARD_NUMBER: return 'Card Number';
      default: return opt;
    }
  };

  const getDirectionLabel = () => {
    if (settings.sortBy === SortOption.VALUE) return settings.sortDirection === SortDirection.DESC ? 'High to Low' : 'Low to High';
    if (settings.sortBy === SortOption.NAME || settings.sortBy === SortOption.SET) return settings.sortDirection === SortDirection.ASC ? 'A-Z' : 'Z-A';
    return settings.sortDirection === SortDirection.DESC ? 'Newest First' : 'Oldest First';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-midnight/80 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-navy/95 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-bold text-light-slate">Display Options</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Icons.Close className="text-slate-text" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* View & Layout */}
          <section>
            <h3 className="text-xs font-bold text-slate-text uppercase tracking-wider mb-3">View & Layout</h3>
            <div className="flex gap-3 mb-4">
              <button 
                onClick={() => updateSetting('viewMode', 'grid')}
                className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${settings.viewMode === 'grid' ? `${activeBg} text-midnight border-transparent` : 'bg-midnight/50 border-white/10 text-slate-text'}`}
              >
                <Icons.Grid size={20} />
                <span className="text-xs font-bold">Grid</span>
              </button>
              <button 
                onClick={() => updateSetting('viewMode', 'list')}
                className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${settings.viewMode === 'list' ? `${activeBg} text-midnight border-transparent` : 'bg-midnight/50 border-white/10 text-slate-text'}`}
              >
                <Icons.List size={20} />
                <span className="text-xs font-bold">List</span>
              </button>
            </div>

            {settings.viewMode === 'grid' && (
              <div className="bg-midnight/50 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between text-xs font-bold text-slate-text mb-2">
                  <span>Detailed</span>
                  <span>Compact</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((zoom) => (
                    <button
                      key={zoom}
                      onClick={() => updateSetting('gridZoom', zoom as 1|2|3|4|5)}
                      className={`flex-1 h-8 rounded-lg font-bold text-sm transition-all ${settings.gridZoom === zoom ? `${activeBg} text-midnight` : 'bg-navy border border-white/5 text-slate-text hover:bg-white/5'}`}
                    >
                      {zoom}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Sort By */}
          <section>
            <h3 className="text-xs font-bold text-slate-text uppercase tracking-wider mb-3">Sort By</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {Object.values(SortOption).map((option) => (
                <button
                  key={option}
                  onClick={() => updateSetting('sortBy', option)}
                  className={`px-4 py-3 rounded-xl text-left text-sm font-bold transition-all border ${settings.sortBy === option ? `${activeBorder} bg-white/5 text-light-slate` : 'border-white/5 bg-midnight/50 text-slate-text hover:bg-white/5'}`}
                >
                  {getSortLabel(option)}
                </button>
              ))}
            </div>
            <button 
              onClick={() => updateSetting('sortDirection', settings.sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC)}
              className="w-full py-3 rounded-xl bg-midnight/50 border border-white/10 flex items-center justify-center gap-2 text-light-slate font-bold hover:bg-white/5 transition-colors"
            >
              {settings.sortDirection === SortDirection.ASC ? <Icons.ArrowUp size={16} /> : <Icons.ArrowDown size={16} />}
              {getDirectionLabel()}
            </button>
          </section>

          {/* Group By */}
          <section>
            <h3 className="text-xs font-bold text-slate-text uppercase tracking-wider mb-3">Group By</h3>
            <div className="flex flex-wrap gap-2">
               {Object.values(GroupOption).map((option) => (
                 <button
                   key={option}
                   onClick={() => updateSetting('groupBy', option)}
                   className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${settings.groupBy === option ? `${activeColor} bg-white/10 ring-1 ring-inset ${activeBorder.replace('border-', 'ring-')}` : 'text-slate-text bg-midnight/50 hover:bg-white/5'}`}
                 >
                   {option}
                 </button>
               ))}
            </div>
          </section>

          {/* Currency */}
          <section>
            <h3 className="text-xs font-bold text-slate-text uppercase tracking-wider mb-3">Currency</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(Currency).map((curr) => (
                <button
                  key={curr}
                  onClick={() => onUpdateCurrency(curr)}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${currency === curr ? `${activeBg} text-midnight` : 'bg-midnight/50 text-slate-text border border-white/5'}`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </section>

           {/* Language Filter */}
           <section>
             <div className="flex justify-between items-center mb-3">
               <h3 className="text-xs font-bold text-slate-text uppercase tracking-wider">Card Edition</h3>
               <button 
                 onClick={() => updateSetting('visibleLanguages', Object.values(CardLanguage))}
                 className={`text-xs font-bold ${activeColor} hover:underline`}
               >
                 Show All
               </button>
             </div>
             <div className="grid grid-cols-2 gap-2">
               {Object.values(CardLanguage).map((lang) => {
                 const isActive = settings.visibleLanguages.includes(lang);
                 return (
                   <button
                     key={lang}
                     onClick={() => toggleLanguage(lang)}
                     className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${isActive ? 'border-white/20 bg-white/5 text-light-slate' : 'border-transparent bg-midnight/30 text-slate-text opacity-50'}`}
                   >
                     <div className={`w-4 h-4 rounded-full border border-white/10 flex items-center justify-center shrink-0 ${isActive ? activeBg : 'bg-slate-700'}`}>
                       {isActive && <Icons.Check size={10} className="text-midnight" />}
                     </div>
                     <span className="text-sm font-medium truncate">{lang}</span>
                   </button>
                 );
               })}
             </div>
           </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-navy/95 shrink-0">
          <button 
            onClick={onClose}
            className={`w-full py-4 rounded-xl font-bold text-midnight shadow-lg active:scale-95 transition-all ${activeBg}`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
