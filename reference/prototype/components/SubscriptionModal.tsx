
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Icons } from './Icons';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'yearly') => void;
}

type FeatureCategory = {
  title: string;
  icon: keyof typeof Icons;
  items: { label: string; desc: string }[];
};

const FEATURES: FeatureCategory[] = [
  {
    title: "Personalization & Identity",
    icon: 'Profile',
    items: [
      { label: "Exclusive PRO Themes & Icons", desc: "Customize your app’s look with unique styles" },
      { label: "Blue Checkmark Verification", desc: "Fast-track your collector credibility" }
    ]
  },
  {
    title: "Collection Power Tools",
    icon: 'Layers',
    items: [
      { label: "Unlimited Scanning", desc: "Scan cards from all major TCGs without limits" },
      { label: "Graded & Variant Card Support", desc: "Add unlimited graded cards and variants" },
      { label: "Advanced Filters & Search History", desc: "Pinpoint cards and revisit past searches" },
      { label: "Notes & Lists", desc: "Create themed lists and add unlimited notes to cards" }
    ]
  },
  {
    title: "Portfolio Intelligence",
    icon: 'PieChart',
    items: [
      { label: "P&L Tracking", desc: "Monitor gains with 5+ years of pricing data" },
      { label: "Set Analytics", desc: "Deep insights into set values and trends" },
      { label: "Weekly Performance Updates", desc: "Stay informed with automatic summaries" },
      { label: "Home Screen Widgets", desc: "Real-time portfolio value at a glance" }
    ]
  },
  {
    title: "Export & Sharing",
    icon: 'ExternalLink',
    items: [
      { label: "Seamless Exports", desc: "Export your collection, wishlist, lists, and notes" },
      { label: "Shareable Content", desc: "Showcase your collection with friends or the community" }
    ]
  },
  {
    title: "Community & Perks",
    icon: 'Trophy',
    items: [
      { label: "Monthly Giveaways", desc: "Win exclusive prizes and rare cards" },
      { label: "Broadcast Alerts", desc: "Get notified about deals, drops, and updates" },
      { label: "Premium Discord Role", desc: "Stand out in the Kado Hunter community" }
    ]
  }
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onSubscribe }) => {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setIsProcessing(true);
    if (navigator.vibrate) navigator.vibrate(20);
    
    // Simulate API / Payment Gateway Delay
    setTimeout(() => {
        setIsProcessing(false);
        onSubscribe(plan);
    }, 2000);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-midnight/90 backdrop-blur-xl transition-opacity duration-300" 
        onClick={onClose}
      ></div>
      
      {/* Modal Container - Reduced max-height to feel denser */}
      <div className="relative w-full max-w-md bg-navy/95 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[85vh]">
        
        {/* Close Button - Floating */}
        <button 
            onClick={onClose} 
            disabled={isProcessing} 
            className="absolute top-3 right-3 z-50 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md"
        >
            <Icons.Close size={16} />
        </button>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1 no-scrollbar scroll-smooth bg-gradient-to-b from-navy via-midnight to-navy">
            
            {/* Slim Hero Section */}
            <div className="relative pt-6 pb-2 px-6 text-center overflow-hidden shrink-0">
                {/* Dynamic Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent z-0"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-amber-500/20 blur-[80px] rounded-full pointer-events-none z-0"></div>
                
                {/* Icon/Badge - Reduced size */}
                <div className="relative z-10 mx-auto w-12 h-12 mb-2 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-600 p-[1px] shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-float">
                    <div className="w-full h-full bg-navy/80 backdrop-blur-sm rounded-[15px] flex items-center justify-center">
                         <Icons.Zap size={24} className="text-amber-400 drop-shadow-lg" fill="currentColor" />
                    </div>
                </div>

                <h2 className="relative z-10 text-xl font-bold text-white mb-1 tracking-tight leading-tight">
                    Hunter <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">PRO</span>
                </h2>
                <p className="relative z-10 text-slate-400 text-xs max-w-xs mx-auto leading-tight">
                    Unlock advanced market intelligence and unlimited tracking.
                </p>
            </div>

            {/* Features List - Denser spacing */}
            <div className="px-5 py-3 space-y-4 relative z-10">
                {FEATURES.map((category, idx) => {
                    const Icon = Icons[category.icon];
                    return (
                        <div key={idx} className="group">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Icon size={14} className="text-amber-400" />
                                <h3 className="text-[10px] font-bold text-light-slate uppercase tracking-wider">{category.title}</h3>
                            </div>
                            <div className="grid gap-1.5 pl-2 border-l border-white/10 group-hover:border-amber-500/30 transition-colors ml-1.5">
                                {category.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="pl-3 relative py-0.5">
                                        <p className="text-xs font-bold text-slate-200 leading-tight">{item.label}</p>
                                        <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Bottom spacing for scroll content to not be hidden by footer gradient if any */}
            <div className="h-4"></div>
        </div>

        {/* Sticky Bottom Footer: Plans & CTA - Dense Layout */}
        <div className="p-3 bg-[#0a192f]/95 backdrop-blur-xl border-t border-white/5 shrink-0 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative">
            
            {/* Plan Selector - Dense */}
            <div className="flex gap-2 mb-2">
                <button 
                    onClick={() => setPlan('monthly')}
                    className={`flex-1 py-2 px-2 rounded-xl border transition-all duration-300 text-center relative overflow-hidden group
                        ${plan === 'monthly' 
                        ? 'bg-white/5 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                        : 'bg-transparent border-white/10 hover:bg-white/5 opacity-60 hover:opacity-100'}
                    `}
                >
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                         <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-white">$7.99</span>
                            <span className="text-[9px] text-slate-500">/mo</span>
                         </div>
                         <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Monthly</span>
                    </div>
                </button>

                <button 
                    onClick={() => setPlan('yearly')}
                    className={`flex-1 py-2 px-2 rounded-xl border transition-all duration-300 text-center relative overflow-hidden
                        ${plan === 'yearly' 
                        ? 'bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                        : 'bg-transparent border-white/10 hover:bg-white/5 opacity-60 hover:opacity-100'}
                    `}
                >
                    <div className="absolute top-0 right-0 bg-amber-500 text-midnight text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg z-20">
                        SAVE 38%
                    </div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                        <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-white">$59.99</span>
                            <span className="text-[9px] text-amber-200/60">/yr</span>
                         </div>
                         <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">Yearly</span>
                    </div>
                </button>
            </div>

            {/* Action Button - Slimmer height */}
            <button 
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-midnight font-bold text-sm shadow-lg hover:shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
            >
                {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>
                        <span>Unlock Pro Access</span>
                        <Icons.Zap size={16} fill="currentColor" className="text-midnight" />
                    </>
                )}
            </button>
            <p className="text-center text-[9px] text-slate-500 mt-2">
                Recurring billing. Cancel anytime.
            </p>
        </div>

      </div>
    </div>,
    document.body
  );
};
