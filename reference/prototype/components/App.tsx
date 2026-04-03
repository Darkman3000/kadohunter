
import React, { useState, useEffect } from 'react';
import { Icons } from './components/Icons';
import { AppView, Card, UserProfile, Currency, ScanMode, FleaSession } from './types';
import { ScannerView } from './components/ScannerView';
import { BinderView } from './components/BinderView';
import { MarketView } from './components/MarketView';
import { TradeView } from './components/TradeView';
import { ProfileView } from './components/ProfileView';
import { AuthModal } from './components/AuthModal';
import { CardDetail } from './components/CardDetail';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ImportModal } from './components/ImportModal';
import { useMockData } from './services/mockDataService';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Hunter_One',
  avatar: 'dawn',
  level: 5,
  xp: 2450,
  achievements: [],
  isPro: false,
  subscriptionPlan: null,
  primaryMarket: 'TCGplayer',
  title: 'Single Star Hunter',
  region: 'NA - West',
  timezone: 'PST',
  bio: 'Vintage collector & arbitrage specialist. Hunting for the perfect swirl.',
  socials: {
    twitter: '@hunter_one',
    discord: 'hunter#1234',
    website: 'kado.gg/hunter'
  },
  trading: {
      openToTrades: true,
      shipFromCountry: 'USA',
      typicalShipTime: '1-2 Days',
      packagingStandard: 'Toploader + Bubble',
      acceptedConditions: ['NM', 'LP'],
      acceptedLanguages: ['English', 'Japanese'],
      paymentMethods: ['PayPal G&S', 'Escrow'],
      preferredTCGs: ['Pokemon', 'Magic']
  },
  notifications: {
      inApp: true,
      email: false,
      push: true,
      dailyDigestTime: '09:00',
      volumeCap: 50,
      scoreThreshold: 80
  },
  privacy: {
      portfolioVisibility: 'Everyone',
      showDuplicates: true,
      showRecentAcquisitions: true,
      allowDMs: 'Everyone',
      publicProfile: true
  }
};

const AVATARS: Record<string, string> = {
  dawn: 'bg-gradient-to-br from-orange-500 to-rose-600',
  dusk: 'bg-gradient-to-br from-indigo-500 to-purple-600',
  mint: 'bg-gradient-to-br from-teal-500 to-emerald-600',
  sky: 'bg-gradient-to-br from-blue-500 to-cyan-600',
  gold: 'bg-gradient-to-br from-amber-400 to-yellow-600',
};

// Custom Logo Component for the Sidebar
const KadoLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-midnight">
     <path d="M4 4H9V20H4V4Z" />
     <path d="M20 4H15L9 12L15 20H20L14 12L20 4Z" />
  </svg>
);

export const App: React.FC = () => {
  const { mockCards } = useMockData();
  const [currentView, setCurrentView] = useState<AppView>(AppView.BINDER);
  const [collection, setCollection] = useState<Card[]>([]);
  const [scannedCard, setScannedCard] = useState<Card | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [isBinderSelectionMode, setIsBinderSelectionMode] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isPureView, setIsPureView] = useState(false);
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Scanner & Trade State
  const [scanMode, setScanMode] = useState<ScanMode>(ScanMode.ADD_TO_BINDER);
  const [activeTradeTab, setActiveTradeTab] = useState<'desk' | 'flea'>('desk');
  const [profileTab, setProfileTab] = useState<'network' | 'main'>('network');

  // Initialize with mock data
  useEffect(() => {
    setCollection(mockCards);
  }, [mockCards]);

  // Load profile and auth state from local storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedCurrency = localStorage.getItem('currency');
    
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse user profile", e);
      }
    }

    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    } else {
       setIsAuthenticated(false); 
    }

    if (savedCurrency && Object.values(Currency).includes(savedCurrency as Currency)) {
      setCurrency(savedCurrency as Currency);
    }
  }, []);

  // Save profile and settings to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const handleLogin = (username?: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    
    if (username) {
        const newProfile = { ...userProfile, name: username };
        setUserProfile(newProfile);
        showNotification(`Welcome to the Guild, ${username}.`);
    } else {
        showNotification("Welcome back, Hunter.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    showNotification("You have been logged out.");
  };

  // Handle Card Scan Result (Single Card)
  const handleCardScanned = (card: Card) => {
    setScannedCard(card);
  };

  // Handle Flea Market Session Save
  const handleSaveSession = (session: FleaSession) => {
      try {
          const existingStr = localStorage.getItem('fleaSessions');
          let existing: FleaSession[] = [];
          
          if (existingStr) {
              try {
                  const parsed = JSON.parse(existingStr);
                  if (Array.isArray(parsed)) {
                      existing = parsed;
                  }
              } catch (e) {
                  console.warn("Failed to parse existing flea sessions, resetting.", e);
              }
          }
          
          const updatedSessions = [session, ...existing];
          localStorage.setItem('fleaSessions', JSON.stringify(updatedSessions));
          
          setActiveTradeTab('flea');
          setCurrentView(AppView.TRADE);
          showNotification("Flea Market session saved successfully.");
      } catch (error) {
          console.error("Critical error saving session:", error);
          showNotification("Error saving session. Please check console.");
      }
  };

  const confirmScan = () => {
    if (scannedCard) {
      setCollection(prev => [scannedCard, ...prev]);
      setScannedCard(null);
      setCurrentView(AppView.BINDER);
      showNotification("Card secured in archives");
    }
  };

  // Handle Card Selection
  const handleSelectCard = (card: Card) => {
      if (card.isNew) {
          const updatedCard = { ...card, isNew: false };
          setCollection(prev => prev.map(c => c.id === card.id ? updatedCard : c));
          setSelectedCard(updatedCard);
      } else {
          setSelectedCard(card);
      }
  };

  const handleCollectionOperation = (operation: 'add' | 'update' | 'delete', card: Card) => {
    if (operation === 'add') {
      setCollection(prev => [...prev, card]);
      showNotification("Variant added to collection");
    } else if (operation === 'update') {
      setCollection(prev => prev.map(c => c.id === card.id ? card : c));
      if (selectedCard?.id === card.id) setSelectedCard(card); 
    } else if (operation === 'delete') {
      setCollection(prev => prev.filter(c => c.id !== card.id));
      if (selectedCard?.id === card.id) {
         const sibling = collection.find(c => c.id !== card.id && c.name === card.name && c.set === card.set && c.number === card.number);
         if (sibling) setSelectedCard(sibling);
         else setSelectedCard(null);
      }
      showNotification("Variant removed");
    }
  };

  const handleUpdateCards = (updatedCards: Card[]) => {
    setCollection(updatedCards);
    showNotification("Collection updated");
  };

  const handleImportCards = (newCards: Card[]) => {
      setCollection(prev => [...prev, ...newCards]);
      showNotification(`${newCards.length} cards added to collection.`);
  };

  const handleProUpgrade = (plan: 'monthly' | 'yearly') => {
      setIsSubModalOpen(false);
      setUserProfile(prev => ({ 
          ...prev, 
          isPro: true,
          subscriptionPlan: plan
      }));
      showNotification(`Welcome to Hunter PRO! (${plan === 'monthly' ? 'Monthly' : 'Yearly'})`);
  };

  const startFleaSession = () => {
      setScanMode(ScanMode.FLEA_MARKET);
      setCurrentView(AppView.SCANNER);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
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

  const triggerHaptic = () => {
      if (navigator.vibrate) navigator.vibrate(10);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => { setCurrentView(view); triggerHaptic(); }}
        className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 h-full px-4 relative group active:scale-95
          ${isActive ? 'text-umber' : 'text-slate-400 hover:text-light-slate'}
        `}
      >
        {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-umber rounded-b-full"></div>}
        {view === AppView.PROFILE ? (
          <div className="relative shrink-0">
            <Icons.Globe size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-all duration-300" />
            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center border-[1.5px] border-[#0a192f] ${isActive ? 'bg-umber text-navy' : 'bg-slate-600 text-white'}`}>
                <Icons.Profile size={8} strokeWidth={3} fill="currentColor" />
            </div>
          </div>
        ) : (
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} fill="none" className="shrink-0" />
        )}
        <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
      </button>
    );
  };

  const DesktopNavItem = ({ view, icon: Icon, label, isCollapsed }: { view: AppView, icon: any, label: string, isCollapsed: boolean }) => {
    const isActive = currentView === view;
    
    return (
      <button 
        onClick={() => { setCurrentView(view); triggerHaptic(); }}
        className={`w-full flex items-center py-3 rounded-xl transition-all duration-300 ease-bounce-sm relative group text-sm font-medium overflow-hidden whitespace-nowrap gap-0 active:scale-95
          ${isCollapsed ? 'justify-center px-0' : 'justify-start px-4 gap-3'}
          ${isActive ? 'bg-umber/10 text-umber' : 'text-slate-text hover:text-light-slate hover:bg-white/5'}
        `}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} className="shrink-0 transition-all duration-300" />
        
        <div className={`
            flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out
            ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
        `}>
            <span>{label}</span>
        </div>

        {isActive && !isCollapsed && <div className="absolute left-0 w-1 h-6 bg-umber rounded-r-full animate-fade-in"></div>}
         
         {isCollapsed && (
            <div className="absolute left-14 ml-2 px-3 py-1.5 bg-navy/90 backdrop-blur-md border border-white/10 text-light-slate text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                {label}
            </div>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-umber/10 via-midnight to-midnight overflow-hidden font-sans text-light-slate">
      
      {!isAuthenticated && (
        <AuthModal onAuthenticated={handleLogin} />
      )}

      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        onSubscribe={handleProUpgrade}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCards}
      />

      {selectedCard && (
          <CardDetail 
            card={selectedCard}
            collection={collection}
            onClose={() => setSelectedCard(null)}
            onCollectionUpdate={handleCollectionOperation}
            currency={currency}
            userProfile={userProfile}
            onUpgrade={() => setIsSubModalOpen(true)}
          />
      )}

      <main className={`h-full w-full relative transition-[padding] duration-300 ease-in-out ${isPureView ? 'md:pl-0' : (isSidebarCollapsed ? 'md:pl-16' : 'md:pl-48')} ${!isAuthenticated ? 'filter blur-sm pointer-events-none' : ''}`}>
        
        {/* Page Transition Wrapper */}
        <div key={currentView} className="h-full w-full animate-spring-up">
            {currentView === AppView.SCANNER && (
            <div className="h-full w-full p-4 pb-32 md:pb-4">
                <ScannerView 
                    onCardScanned={handleCardScanned} 
                    initialMode={scanMode}
                    onSaveSession={handleSaveSession}
                    onBulkScan={handleImportCards}
                />
            </div>
            )}
            
            {currentView === AppView.BINDER && (
            <div className="h-full">
                <BinderView 
                    cards={collection} 
                    currency={currency} 
                    setCurrency={setCurrency} 
                    onCardClick={handleSelectCard}
                    onUpdateCards={handleUpdateCards}
                    onSelectionModeChange={setIsBinderSelectionMode}
                    isPureView={isPureView}
                    onPureViewToggle={() => setIsPureView(!isPureView)}
                />
            </div>
            )}

            {currentView === AppView.MARKET && (
            <div className="h-full">
                <MarketView 
                    cards={collection} 
                    currency={currency}
                    onCardClick={handleSelectCard}
                    userProfile={userProfile}
                    onUpgrade={() => setIsSubModalOpen(true)}
                />
            </div>
            )}

            {currentView === AppView.TRADE && (
            <div className="h-full">
                <TradeView 
                collection={collection} 
                currency={currency}
                onStartSession={startFleaSession}
                onImportCards={handleImportCards}
                initialTab={activeTradeTab}
                onNotify={showNotification}
                />
            </div>
            )}

            {currentView === AppView.PROFILE && (
            <div className="h-full">
                <ProfileView 
                profile={userProfile} 
                onUpdateProfile={setUserProfile} 
                collection={collection}
                currency={currency}
                setCurrency={setCurrency}
                onLogout={handleLogout}
                onOpenImport={() => setIsImportModalOpen(true)}
                onUpgrade={() => setIsSubModalOpen(true)}
                onNotify={showNotification}
                initialTab={profileTab}
                onNavigateToTrade={() => setCurrentView(AppView.TRADE)}
                />
            </div>
            )}
        </div>
      </main>

      {scannedCard && isAuthenticated && (
        <div className="absolute inset-0 z-50 bg-midnight/80 backdrop-blur-md flex items-center justify-center p-6 animate-spring-up">
          <div className="bg-navy/90 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <div 
                className="aspect-[3/4] bg-midnight/50 rounded-md mb-4 overflow-hidden border border-white/5 shadow-inner card-thumbnail is-new"
                style={{ '--shimmer-color': getShimmerColor(scannedCard.rarity) } as React.CSSProperties}
            >
              <img src={scannedCard.imageUrl} className="w-full h-full object-cover" alt="Scanned" />
            </div>
            <h2 className="text-xl font-bold text-light-slate mb-1">{scannedCard.name}</h2>
            <p className="text-slate-text text-sm mb-6">{scannedCard.set} • {scannedCard.rarity}</p>
            
            <div className="bg-midnight/50 border border-umber/20 p-4 rounded-xl mb-6 flex justify-between items-center">
              <span className="text-umber font-bold text-xs tracking-wider uppercase">Estimated Value</span>
              <span className="text-2xl font-bold text-light-slate">${scannedCard.price.toFixed(2)}</span>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setScannedCard(null)}
                className="flex-1 py-3 rounded-xl border border-slate-700 font-semibold text-slate-text hover:bg-white/5 transition-colors active:scale-95"
              >
                Discard
              </button>
              <button 
                onClick={confirmScan}
                className="flex-1 py-3 rounded-xl bg-umber text-midnight font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-navy border border-umber/30 text-light-slate px-6 py-3 rounded-full shadow-soft-lg z-[70] flex items-center gap-3 text-sm font-medium animate-spring-up backdrop-blur-md">
          <div className="w-5 h-5 rounded-full bg-umber flex items-center justify-center text-midnight">
            <Icons.Check size={12} strokeWidth={3} />
          </div>
          {notification}
        </div>
      )}

      {isAuthenticated && !isBinderSelectionMode && !isPureView && (
        <>
          {/* Mobile Bottom Dock */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[calc(4rem+env(safe-area-inset-bottom))] bg-[#0a192f]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
              <NavItem view={AppView.BINDER} icon={Icons.Binder} label="Binder" />
              <NavItem view={AppView.MARKET} icon={Icons.Market} label="Market" />
              
              <div className="relative -top-6">
                 <button 
                   onClick={() => { setScanMode(ScanMode.ADD_TO_BINDER); setCurrentView(AppView.SCANNER); triggerHaptic(); }}
                   className="w-14 h-14 bg-umber rounded-2xl shadow-[0_4px_25px_rgba(199,167,123,0.4)] flex items-center justify-center text-midnight active:scale-90 transition-transform border-4 border-[#0a192f] ease-bounce-sm hover:scale-105"
                 >
                   <Icons.Scan size={26} strokeWidth={2.5} />
                 </button>
              </div>
  
              <NavItem view={AppView.TRADE} icon={Icons.Trade} label="Trade" />
              <NavItem view={AppView.PROFILE} icon={Icons.Globe} label="Net" />
          </div>

          {/* Desktop Side Rail */}
          <div className={`hidden md:flex fixed left-0 top-0 h-screen z-40 flex-col bg-navy/80 backdrop-blur-xl border-r border-white/10 py-4 shadow-2xl transition-[width] duration-300 ease-in-out ${isSidebarCollapsed ? 'w-16' : 'w-48'}`}>
             
             <div className={`flex items-center transition-all duration-300 ease-in-out mb-6 overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'}`}>
                <div className="w-8 h-8 bg-teal-500 text-midnight rounded-lg flex items-center justify-center shrink-0 shadow-lg">
                    <KadoLogo />
                </div>
                 <span className={`font-bold text-lg text-light-slate transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>Kado Hunter</span>
             </div>
             
             <nav className="flex flex-col gap-2 px-2">
                <DesktopNavItem view={AppView.BINDER} icon={Icons.Binder} label="My Binder" isCollapsed={isSidebarCollapsed} />
                <DesktopNavItem view={AppView.MARKET} icon={Icons.Market} label="Market" isCollapsed={isSidebarCollapsed} />
                <DesktopNavItem view={AppView.TRADE} icon={Icons.Trade} label="Trade Desk" isCollapsed={isSidebarCollapsed} />
             </nav>

             <div className="px-2 mt-4">
                <button 
                    onClick={() => { setScanMode(ScanMode.ADD_TO_BINDER); setCurrentView(AppView.SCANNER); triggerHaptic(); }}
                    className={`w-full flex items-center py-3 rounded-xl transition-all duration-300 ease-bounce-sm text-sm font-bold relative group overflow-hidden whitespace-nowrap gap-0 active:scale-95
                    ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4 gap-3'}
                    ${currentView === AppView.SCANNER 
                        ? 'bg-umber text-midnight shadow-[0_0_20px_rgba(199,167,123,0.3)]' 
                        : 'bg-umber/10 text-umber hover:bg-umber/20 border border-umber/20'
                    }`}
                >
                    <Icons.Scan size={20} className="shrink-0" />
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                        <span>New Scan</span>
                    </div>
                    {isSidebarCollapsed && (
                        <div className="absolute left-14 ml-2 px-3 py-1.5 bg-navy/90 backdrop-blur-md border border-white/10 text-light-slate text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                            New Scan
                        </div>
                    )}
                </button>
             </div>

             <div className="mt-auto flex flex-col gap-1 px-2">
                {/* Hunter Net Button */}
                <button 
                  onClick={() => { setCurrentView(AppView.PROFILE); setProfileTab('network'); triggerHaptic(); }}
                  className={`w-full flex items-center py-3 rounded-xl transition-all duration-300 ease-bounce-sm relative group text-sm font-medium overflow-hidden whitespace-nowrap gap-0 active:scale-95
                  ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4 gap-3'}
                  ${currentView === AppView.PROFILE ? 'bg-umber/10 text-umber' : 'text-slate-text hover:text-light-slate hover:bg-white/5'}`}
                >
                  <div className="relative shrink-0">
                    <Icons.Globe size={22} strokeWidth={currentView === AppView.PROFILE ? 2.5 : 2} className="transition-all duration-300" />
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center border-[1.5px] border-navy ${currentView === AppView.PROFILE ? 'bg-umber text-navy' : 'bg-slate-600 text-white'}`}>
                        <Icons.Profile size={8} strokeWidth={3} fill="currentColor" />
                    </div>
                  </div>
                  <div className={`flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                      <span>Hunter Net</span>
                  </div>
                  {currentView === AppView.PROFILE && !isSidebarCollapsed && <div className="absolute left-0 w-1 h-6 bg-umber rounded-r-full animate-fade-in"></div>}
                  {isSidebarCollapsed && (
                    <div className="absolute left-14 ml-2 px-3 py-1.5 bg-navy/90 backdrop-blur-md border border-white/10 text-light-slate text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                        Hunter Net
                    </div>
                  )}
                </button>
                
                <button 
                  onClick={() => { handleLogout(); triggerHaptic(); }}
                  className={`w-full flex items-center py-3 rounded-xl transition-all duration-300 ease-bounce-sm text-sm font-medium text-slate-text hover:text-rose-400 hover:bg-rose-500/10 relative group overflow-hidden whitespace-nowrap gap-0 active:scale-95
                  ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4 gap-4'}`}
                >
                  <Icons.LogIn size={22} className="rotate-180 shrink-0 transition-colors" />
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                     <span>Logout</span>
                  </div>
                   {isSidebarCollapsed && (
                    <div className="absolute left-14 ml-2 px-3 py-1.5 bg-navy/90 backdrop-blur-md border border-white/10 text-light-slate text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                        Logout
                    </div>
                  )}
                </button>

                <div className="w-full h-px bg-white/5 my-1"></div>
                
                 <button 
                    onClick={() => { setIsSidebarCollapsed(!isSidebarCollapsed); triggerHaptic(); }}
                    className={`w-full flex items-center py-3 rounded-xl transition-all duration-300 ease-bounce-sm text-sm font-medium text-slate-text hover:text-light-slate hover:bg-white/5 relative group overflow-hidden whitespace-nowrap gap-0 active:scale-95
                    ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4 gap-4'}`}
                >
                    <Icons.ChevronLeft size={20} className={`transition-transform duration-300 shrink-0 ${isSidebarCollapsed ? 'rotate-180' : 'rotate-0'}`} />
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                         <span>Collapse</span>
                    </div>
                </button>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
