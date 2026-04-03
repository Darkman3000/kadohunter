
import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Card, Currency, Achievement, MarketSource, Friend, FleaSession, FeedItem, NewsChannel } from '../types';
import { Icons } from './Icons';
import { FeedbackModal } from './FeedbackModal';
import { OracleModal } from './OracleModal';
import { useMockData, formatCurrency, generateHunterFeed, mockNewsChannels } from '../services/mockDataService';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  collection: Card[];
  currency: Currency;
  setCurrency: (c: Currency) => void;
  onLogout?: () => void;
  onOpenImport?: () => void;
  onUpgrade?: () => void;
  onNotify?: (msg: string) => void;
  onNavigateToTrade?: () => void;
  onCardClick?: (card: any) => void;
  initialTab?: 'feed' | 'network' | 'rivalry' | 'guilds' | 'identity';
}

type SubView = 'main' | 'settings' | 'logs' | 'achievements' | 'data' | 'network';

const AVATARS: { id: string, bg: string, label: string }[] = [
  { id: 'dawn', bg: 'bg-gradient-to-br from-orange-500 to-rose-600', label: 'Dawn' },
  { id: 'dusk', bg: 'bg-gradient-to-br from-indigo-500 to-purple-600', label: 'Dusk' },
  { id: 'mint', bg: 'bg-gradient-to-br from-teal-500 to-emerald-600', label: 'Mint' },
  { id: 'sky', bg: 'bg-gradient-to-br from-blue-500 to-cyan-600', label: 'Sky' },
  { id: 'gold', bg: 'bg-gradient-to-br from-amber-400 to-yellow-600', label: 'Gold' },
];

const getAvatarBg = (id: string) => AVATARS.find(a => a.id === id)?.bg || 'bg-gray-700';

const HunterLicenseCard = ({ profile, onShare }: { profile: UserProfile, onShare: () => void }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Generate QR Data
  const qrData = `https://kado.gg/u/${profile.name.replace(/\s+/g, '')}`;
  // API to generate white QR on dark background to match card
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&color=ffffff&bgcolor=151515&margin=0`;

  const hasSocials = profile.socials && Object.values(profile.socials).some(v => v);

  return (
      <div 
        className="relative w-full max-w-[340px] aspect-[1.58] mx-auto mb-8 perspective-1000 group cursor-pointer font-sans select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
          <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
              
              {/* --- FRONT SIDE --- */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-[14px] overflow-hidden bg-[#151515] border border-[#333] shadow-2xl flex flex-col relative">
                  
                  {/* Corner Markers (White Brackets) */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-white/80 rounded-tl-[2px] z-20"></div>
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-white/80 rounded-tr-[2px] z-20"></div>
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-white/80 rounded-bl-[2px] z-20"></div>
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-white/80 rounded-br-[2px] z-20"></div>

                  {/* Content Container */}
                  <div className="relative z-20 flex flex-col h-full p-4">
                      
                      {/* Top Row: HUNTER Header + Diamond */}
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col relative">
                              <h2 className="text-4xl font-black text-white tracking-[0.15em] leading-none italic scale-y-90 origin-bottom-left drop-shadow-md">
                                  HUNTER
                              </h2>
                              {/* Blue Accent Bar */}
                              <div className="h-[3px] w-[105%] bg-blue-500 mt-0.5 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                          </div>
                          
                          {/* Diamond Glyph */}
                          <div className="relative w-8 h-8 flex items-center justify-center">
                              <div className="w-5 h-5 bg-yellow-500 rotate-45 border border-yellow-600"></div>
                              <div className="absolute w-3 h-3 bg-[#151515] rotate-45"></div>
                          </div>
                      </div>

                      {/* Middle: Text + Chip & QR Code */}
                      <div className="flex-1 relative mt-2 pl-1 pr-2">
                          <div className="relative z-10 flex items-center justify-between h-full">
                              {/* Chip */}
                              <div className="w-12 h-9 bg-yellow-600 rounded-[4px] border border-yellow-800 relative overflow-hidden">
                                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/20"></div>
                                  <div className="absolute left-1/3 top-0 h-full w-[1px] bg-black/20"></div>
                                  <div className="absolute left-2/3 top-0 h-full w-[1px] bg-black/20"></div>
                              </div>
                              
                              {/* QR Code (White on Dark) */}
                              <div className="w-14 h-14 bg-[#151515] rounded-[4px] border border-white/20 p-1 flex items-center justify-center shadow-lg relative group/qr">
                                  <img 
                                      src={qrUrl}
                                      alt="Hunter QR"
                                      className="w-full h-full object-contain opacity-90 rendering-pixelated"
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Bottom Row: Identity Info */}
                      <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-end mt-auto">
                          
                          {/* Avatar */}
                          <div className="relative">
                              <div className="w-12 h-12 bg-black rounded-[4px] border border-white/20 p-[2px] shadow-lg relative overflow-hidden">
                                  <div className={`w-full h-full ${getAvatarBg(profile.avatar)}`}>
                                      <div className="w-full h-full flex items-center justify-center text-white/90">
                                          <Icons.Profile size={24} />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Name & Class */}
                          <div className="pb-0.5">
                              <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">IDENTITY</p>
                              <h3 className="text-lg font-black text-white leading-none whitespace-nowrap tracking-wide">{profile.name.toUpperCase()}</h3>
                              <p className="text-[7px] font-bold text-blue-400 uppercase tracking-widest mt-1">
                                  {profile.isPro ? '★★ SINGLE STAR' : 'PROVISIONAL HUNTER'}
                              </p>
                          </div>

                          {/* License No */}
                          <div className="text-right pb-0.5">
                              <p className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">LICENSE NO.</p>
                              <p className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">H6J-8KFP</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* --- BACK SIDE (LINK TREE) --- */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-[14px] overflow-hidden bg-[#111] border border-[#333] flex flex-col shadow-2xl">
                  {/* Magnetic Strip */}
                  <div className="w-full h-10 bg-[#000] border-b border-[#222] mt-5 relative overflow-hidden"></div>
                  
                  <div className="flex-1 flex flex-col p-5 gap-3">
                      <div>
                          <p className="text-[8px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Hunter Association</p>
                          <p className="text-[7px] text-slate-600 leading-relaxed font-mono">
                              This license grants the holder access to restricted areas and trading platforms.
                          </p>
                      </div>
                      
                      {/* Interactive Link Tree */}
                      <div className="flex-1 flex flex-col justify-center border-t border-b border-[#222] py-2 my-1">
                          {hasSocials ? (
                              <div className="space-y-1.5">
                                  {profile.socials?.twitter && (
                                      <button onClick={(e) => e.stopPropagation()} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition-colors group text-left">
                                          <div className="w-5 h-5 bg-[#222] rounded flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-blue-500 transition-colors">
                                              <Icons.MessageCircle size={10} /> 
                                          </div>
                                          <span className="text-[9px] font-mono text-slate-300 group-hover:text-blue-400">@{profile.socials.twitter.replace('@','')}</span>
                                      </button>
                                  )}
                                  {profile.socials?.discord && (
                                      <button onClick={(e) => e.stopPropagation()} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition-colors group text-left">
                                          <div className="w-5 h-5 bg-[#222] rounded flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-indigo-500 transition-colors">
                                              <Icons.MessageSquare size={10} /> 
                                          </div>
                                          <span className="text-[9px] font-mono text-slate-300 group-hover:text-indigo-400">{profile.socials.discord}</span>
                                      </button>
                                  )}
                                  {profile.socials?.website && (
                                      <button onClick={(e) => e.stopPropagation()} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition-colors group text-left">
                                          <div className="w-5 h-5 bg-[#222] rounded flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-emerald-500 transition-colors">
                                              <Icons.Globe size={10} /> 
                                          </div>
                                          <span className="text-[9px] font-mono text-slate-300 group-hover:text-emerald-400 truncate max-w-[150px]">{profile.socials.website.replace(/^https?:\/\//,'')}</span>
                                      </button>
                                  )}
                              </div>
                          ) : (
                              <div className="flex items-center justify-center h-full text-[8px] text-slate-700 italic">
                                  No network connections linked.
                              </div>
                          )}
                      </div>
                      
                      <div className="flex flex-row items-end justify-between gap-4">
                          <div className="flex-1">
                              <p className="text-[7px] text-slate-600 font-mono">
                                  Property of the Hunter Association.
                              </p>
                          </div>
                      </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onShare(); }}
                    className="w-full py-2 bg-blue-600/10 text-blue-400 text-[9px] font-bold uppercase hover:bg-blue-600/20 transition-colors border-t border-blue-500/20"
                  >
                      Share Identity
                  </button>
              </div>

          </div>
      </div>
  );
};

const AddFriendModal = ({ isOpen, onClose, onAdd, onShare }: { isOpen: boolean, onClose: () => void, onAdd: (name: string) => void, onShare: () => void }) => {
    const [name, setName] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSearching(true);
        
        // Simulate network delay
        setTimeout(() => {
            onAdd(name);
            setIsSearching(false);
            setName('');
            onClose();
        }, 800);
    }

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="bg-navy border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-light-slate">Add Friend</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-text hover:text-white transition-colors"><Icons.Close size={20} /></button>
                </div>
                
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Enter a Codename or Hunter ID to send a network request.
                </p>

                {/* Internal Search */}
                <form onSubmit={handleSubmit} className="mb-4 space-y-3">
                    <div className="relative">
                        <input 
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-midnight/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-light-slate focus:border-umber outline-none transition-colors placeholder-slate-text/30"
                            placeholder="Hunter_ID"
                        />
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-text" size={16} />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={!name.trim() || isSearching}
                        className="w-full py-3 bg-umber text-midnight font-bold rounded-xl hover:bg-umber-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        {isSearching ? (
                            <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Send Request</span>
                                <Icons.Send size={16} className="-rotate-45 mt-0.5" />
                            </>
                        )}
                    </button>
                </form>

                {/* Divider for External Options */}
                <div className="relative flex py-2 items-center mb-4">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">Or Invite via Link</span>
                    <div className="flex-grow border-t border-white/5"></div>
                </div>

                {/* External Share Option */}
                <div>
                    <button 
                        onClick={onShare}
                        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-slate-300 text-xs font-bold flex items-center justify-center gap-2 group"
                    >
                        <Icons.Share size={14} className="group-hover:text-white transition-colors" />
                        Share (WhatsApp, Message, etc.)
                    </button>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                        Open your device's share sheet to send an invite.
                    </p>
                </div>
            </div>
        </div>
    );
};

const SessionShareModal = ({ isOpen, onClose, sessions, friendName, onShare }: { isOpen: boolean, onClose: () => void, sessions: FleaSession[], friendName: string, onShare: (s: FleaSession) => void }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="bg-navy border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-light-slate">Select Mission</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-text hover:text-white transition-colors"><Icons.Close size={20} /></button>
                </div>
                <p className="text-xs text-slate-text mb-4">Invite <span className="text-white font-bold">{friendName}</span> to join a session and get their opinion.</p>
                
                {sessions.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-xl">
                        <p className="text-sm text-slate-500 mb-2">No active sessions found.</p>
                        <p className="text-xs text-slate-600">A temporary session will be created.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                        {sessions.map((s: FleaSession) => (
                            <button key={s.id} onClick={() => onShare(s)} className="w-full text-left p-3 rounded-xl bg-midnight/50 border border-white/5 hover:border-umber/50 hover:bg-umber/5 transition-all group">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-light-slate text-sm group-hover:text-umber">{s.name}</span>
                                    <span className="text-[10px] text-slate-500">{new Date(s.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">{s.cards.length} items</span>
                                    <span className="text-slate-300 font-mono">${s.totalValue.toFixed(0)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ... [Keep SignalTunerModal, FeedPostLayout, FeedAction, InteractionState, TradeMatchCard, NewsCard, IntelCard, UserFindingCard, Sparkline] ...
// ... [Retain original components to save space, re-exporting them implicitly if no changes needed, but for the XML output I need to include dependencies or just the changed main component if possible. Since this is a single file replacement, I must include all helper components defined in this file.]

const SignalTunerModal = ({ isOpen, onClose, channels, activeChannels, onToggle }: { 
    isOpen: boolean; 
    onClose: () => void; 
    channels: NewsChannel[]; 
    activeChannels: Set<string>; 
    onToggle: (id: string) => void;
}) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="bg-navy border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                         <Icons.SlidersHorizontal size={20} className="text-blue-400" />
                         <h3 className="text-lg font-bold text-light-slate">Signal Tuner</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-text hover:text-white transition-colors"><Icons.Close size={20} /></button>
                </div>
                <p className="text-xs text-slate-text mb-4">Filter incoming signals and news sources.</p>
                
                <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                    {channels.map((channel) => {
                         const isActive = activeChannels.has(channel.id);
                         return (
                            <button 
                                key={channel.id} 
                                onClick={() => onToggle(channel.id)} 
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isActive ? 'bg-blue-500/10 border-blue-500/50' : 'bg-midnight/50 border-white/5 opacity-60 hover:opacity-100'}`}
                            >
                                 <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                                         {channel.icon && Icons[channel.icon as keyof typeof Icons] ? React.createElement(Icons[channel.icon as keyof typeof Icons], {size: 14}) : <Icons.Globe size={14} />}
                                     </div>
                                     <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{channel.name}</span>
                                 </div>
                                 <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isActive ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
                                     {isActive && <Icons.Check size={10} className="text-white" />}
                                 </div>
                            </button>
                         );
                    })}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-colors">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

const FeedPostLayout = ({ avatar, author, time, children, actions, isAlert = false }: { avatar: React.ReactNode, author: string, time: string, children?: React.ReactNode, actions: React.ReactNode, isAlert?: boolean }) => (
  <div className={`flex gap-3 md:gap-4 p-4 border-b border-white/5 transition-colors ${isAlert ? 'bg-amber-900/5 hover:bg-amber-900/10' : 'hover:bg-white/[0.02]'}`}>
    <div className="shrink-0 pt-1">
       {avatar}
    </div>
    <div className="flex-1 min-w-0">
       <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-bold text-white text-sm hover:underline cursor-pointer">{author}</span>
          <span className="text-slate-500 text-sm">@{author.toLowerCase().replace(/\s+/g,'')} · {time}</span>
       </div>
       <div className="text-sm text-slate-200 leading-normal mb-3 whitespace-pre-line">
          {children}
       </div>
       <div className="flex items-center justify-between max-w-[80%] opacity-70 mt-3">
          {actions}
       </div>
    </div>
  </div>
);

const FeedAction = ({ icon: Icon, count, onClick, active, activeColor = 'text-rose-500' }: { 
    icon: any; 
    count?: number; 
    onClick?: () => void; 
    active?: boolean; 
    activeColor?: string 
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const colorClass = active ? activeColor : 'text-slate-500';
    const hoverColorClass = `hover:${activeColor}`;
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
        onClick?.();
    };

    return (
        <button 
            onClick={handleClick}
            className={`flex items-center gap-1.5 group transition-colors ${colorClass} ${hoverColorClass}`}
        >
            <div className={`p-1.5 rounded-full group-hover:bg-white/10 transition-all ${isAnimating ? 'scale-125' : 'scale-100'}`}>
                <Icon size={16} fill={active ? "currentColor" : "none"} />
            </div>
            {count !== undefined && count > 0 && <span className="text-xs font-medium">{count}</span>}
        </button>
    );
};

type InteractionState = {
  comments: number;
  repeats: number;
  likes: number;
  userRepeated: boolean;
  userLiked: boolean;
};

const TradeMatchCard: React.FC<{ 
    item: FeedItem; 
    isSaved: boolean; 
    interactions: InteractionState;
    onAction: (t: 'save' | 'hide', id: string) => void;
    onInteract: (t: 'repeat' | 'comment' | 'share' | 'like', id: string) => void;
    onNavigateToTrade?: () => void;
    onCardClick?: (card: any) => void;
}> = ({ item, isSaved, interactions, onAction, onInteract, onNavigateToTrade, onCardClick }) => (
    <FeedPostLayout
        avatar={
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Icons.Repeat size={20} />
            </div>
        }
        author="TradeNet"
        time={item.createdAt}
        actions={
            <>
                <FeedAction icon={Icons.MessageCircle} count={interactions.comments} onClick={() => onInteract('comment', item.id)} activeColor="text-blue-400" />
                <FeedAction icon={Icons.Repeat} count={interactions.repeats} onClick={() => onInteract('repeat', item.id)} active={interactions.userRepeated} activeColor="text-emerald-400" />
                <FeedAction icon={Icons.Star} count={interactions.likes} onClick={() => onInteract('like', item.id)} active={interactions.userLiked} activeColor="text-amber-400" />
                <FeedAction icon={Icons.Share} onClick={() => onInteract('share', item.id)} activeColor="text-blue-400" />
            </>
        }
    >
        <div className="mb-2 flex items-start justify-between gap-2">
            <div>
                <span className="font-bold text-emerald-400">{item.confidence}% Match Found.</span> <span className="text-white">{item.message}</span>
            </div>
            {item.ev !== undefined && (
                <div className="shrink-0 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded text-emerald-400 text-xs font-bold font-mono">
                    EV {item.ev > 0 ? '+' : ''}${item.ev.toFixed(2)}
                </div>
            )}
        </div>
        <p className="text-xs text-slate-400 mb-3">{item.explanation}</p>
        
        {item.relatedCards && (
            <div className="bg-black/30 rounded-2xl border border-white/10 p-3 flex items-center gap-4 max-w-md mt-2">
                <div className="text-center shrink-0">
                    <div 
                        className="w-12 h-16 bg-midnight rounded-lg overflow-hidden mb-1 mx-auto border border-white/10 shadow-sm relative group cursor-pointer"
                        onClick={() => item.relatedCards?.you[0] && onCardClick?.(item.relatedCards.you[0])}
                    >
                        {item.relatedCards.you[0]?.imageUrl && <img src={item.relatedCards.you[0].imageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />}
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">You Give</span>
                </div>
                <div className="flex-1 flex justify-center text-slate-600">
                    <Icons.ArrowRight size={20} />
                </div>
                <div className="text-center shrink-0">
                    <div 
                        className="w-12 h-16 bg-midnight rounded-lg overflow-hidden mb-1 mx-auto border border-white/10 shadow-sm relative group cursor-pointer"
                        onClick={() => item.relatedCards?.them[0] && onCardClick?.(item.relatedCards.them[0])}
                    >
                        {item.relatedCards.them[0]?.imageUrl && <img src={item.relatedCards.them[0].imageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />}
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">You Get</span>
                </div>
            </div>
        )}
        
        {item.cta && item.cta.length > 0 && (
            <div className="mt-3">
                <button 
                    onClick={(e) => { e.stopPropagation(); onNavigateToTrade?.(); }}
                    className="px-4 py-2 bg-emerald-500 text-midnight text-xs font-bold rounded-full hover:bg-emerald-400 transition-colors shadow-sm active:scale-95"
                >
                    {item.cta[0].label}
                </button>
            </div>
        )}
    </FeedPostLayout>
);

const NewsCard: React.FC<{ 
    item: FeedItem; 
    interactions: InteractionState;
    onInteract: (t: 'like' | 'repeat' | 'comment' | 'share', id: string) => void;
    onCardClick?: (card: any) => void;
}> = ({ item, interactions, onInteract, onCardClick }) => (
    <FeedPostLayout
        avatar={
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Icons.Globe size={20} />
            </div>
        }
        author={item.source || 'News'}
        time={item.createdAt}
        actions={
            <>
                <FeedAction icon={Icons.MessageCircle} count={interactions.comments} onClick={() => onInteract('comment', item.id)} activeColor="text-blue-400" />
                <FeedAction icon={Icons.Repeat} count={interactions.repeats} onClick={() => onInteract('repeat', item.id)} active={interactions.userRepeated} activeColor="text-emerald-400" />
                <FeedAction icon={Icons.Heart} count={interactions.likes} onClick={() => onInteract('like', item.id)} active={interactions.userLiked} activeColor="text-rose-500" />
                <FeedAction icon={Icons.Share} onClick={() => onInteract('share', item.id)} activeColor="text-blue-400" />
            </>
        }
    >
        <p className="mb-2 font-bold text-white text-base">{item.title}</p>
        <p className="text-sm text-slate-300 mb-3">{item.body}</p>
        {item.image && (
            <div className="rounded-2xl overflow-hidden border border-white/10 w-full relative h-48 md:h-64 bg-midnight mt-2">
                <img src={item.image} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" alt="" />
            </div>
        )}
    </FeedPostLayout>
);

const IntelCard: React.FC<{ 
    item: FeedItem; 
    isSaved: boolean; 
    interactions: InteractionState;
    onAction: (t: 'save' | 'hide', id: string) => void;
    onInteract: (t: 'repeat' | 'comment' | 'share' | 'like', id: string) => void;
    onNavigateToTrade?: () => void;
    onCardClick?: (card: any) => void;
}> = ({ item, isSaved, interactions, onAction, onInteract, onNavigateToTrade, onCardClick }) => (
    <FeedPostLayout
        avatar={
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Icons.BarChart2 size={20} />
            </div>
        }
        author="MarketIntel"
        time={item.createdAt}
        actions={
            <>
                <FeedAction icon={Icons.MessageCircle} count={interactions.comments} onClick={() => onInteract('comment', item.id)} activeColor="text-blue-400" />
                <FeedAction icon={Icons.Repeat} count={interactions.repeats} onClick={() => onInteract('repeat', item.id)} active={interactions.userRepeated} activeColor="text-emerald-400" />
                <FeedAction icon={Icons.Star} count={interactions.likes} onClick={() => onInteract('like', item.id)} active={interactions.userLiked} activeColor="text-amber-400" />
                <FeedAction icon={Icons.Share} onClick={() => onInteract('share', item.id)} activeColor="text-blue-400" />
            </>
        }
    >
        <div className="flex items-start justify-between gap-2 mb-1">
            <div className="font-bold text-indigo-300 text-base">{item.message}</div>
            {item.ev !== undefined && (
                <div className="shrink-0 bg-indigo-500/10 border border-indigo-500/30 px-2 py-1 rounded text-indigo-400 text-xs font-bold font-mono">
                    EV {item.ev > 0 ? '+' : ''}{item.ev}%
                </div>
            )}
        </div>
        <p className="text-sm text-slate-300 mb-2">{item.explanation}</p>
        
        {item.relatedCards && item.relatedCards.them && item.relatedCards.them.length > 0 && (
            <div className="mt-2 mb-3 flex items-center gap-2">
                <div 
                    className="w-8 h-10 bg-midnight rounded overflow-hidden border border-white/10 shadow-sm cursor-pointer"
                    onClick={() => item.relatedCards?.them[0] && onCardClick?.(item.relatedCards.them[0])}
                >
                    {item.relatedCards.them[0].imageUrl && <img src={item.relatedCards.them[0].imageUrl} className="w-full h-full object-cover" alt="" />}
                </div>
                <div className="text-xs text-slate-400">
                    <span className="text-white font-medium">{item.relatedCards.them[0].name}</span>
                    <br />
                    ${item.relatedCards.them[0].price}
                </div>
            </div>
        )}

        {item.sparklineData && (
            <div className="h-16 w-full max-w-sm opacity-80 mt-2 bg-indigo-900/10 rounded-xl p-2 border border-indigo-500/20">
                <Sparkline data={item.sparklineData} color="stroke-indigo-400" />
            </div>
        )}
        
        {item.cta && item.cta.length > 0 && (
            <div className="mt-3 flex gap-2">
                {item.cta.map((c, i) => (
                    <button 
                        key={i}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (c.action === 'execute_arb' || c.action === 'propose_swap') {
                                onNavigateToTrade?.();
                            }
                        }}
                        className="px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-full hover:bg-indigo-500/30 transition-colors shadow-sm active:scale-95"
                    >
                        {c.label}
                    </button>
                ))}
            </div>
        )}
    </FeedPostLayout>
);

const UserFindingCard: React.FC<{ 
    item: FeedItem;
    interactions: InteractionState;
    onInteract: (t: 'like' | 'repeat' | 'comment' | 'share', id: string) => void;
    onNavigateToTrade?: () => void;
    onCardClick?: (card: any) => void;
}> = ({ item, interactions, onInteract, onNavigateToTrade, onCardClick }) => (
    <FeedPostLayout
        avatar={
            <div className={`w-10 h-10 rounded-full ${getAvatarBg(item.avatar || 'sky')} flex items-center justify-center text-white font-bold shadow-md`}>
                {item.author?.substring(0,1)}
            </div>
        }
        author={item.author || 'Hunter'}
        time={item.createdAt}
        actions={
            <>
                <FeedAction icon={Icons.MessageCircle} count={interactions.comments} onClick={() => onInteract('comment', item.id)} activeColor="text-blue-400" />
                <FeedAction icon={Icons.Repeat} count={interactions.repeats} onClick={() => onInteract('repeat', item.id)} active={interactions.userRepeated} activeColor="text-emerald-400" />
                <FeedAction icon={Icons.Heart} count={interactions.likes} onClick={() => onInteract('like', item.id)} active={interactions.userLiked} activeColor="text-rose-500" />
                <FeedAction icon={Icons.Share} onClick={() => onInteract('share', item.id)} activeColor="text-blue-400" />
            </>
        }
    >
        <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-white mb-2">{item.body}</p>
            {item.ev !== undefined && (
                <div className="shrink-0 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded text-amber-400 text-xs font-bold font-mono">
                    EV {item.ev > 0 ? '+' : ''}${item.ev.toFixed(2)}
                </div>
            )}
        </div>
        {item.image && (
            <div 
                className="mt-2 rounded-2xl overflow-hidden border border-white/10 w-32 h-44 bg-midnight inline-block shadow-lg hover:rotate-2 transition-transform cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onCardClick) {
                        onCardClick({
                            id: item.id,
                            name: item.title || 'Found Card',
                            image: item.image,
                            price: item.ev || 0,
                            trend: 'up',
                            condition: 'NM',
                        });
                    }
                }}
            >
                <img src={item.image} className="w-full h-full object-cover" alt="" />
            </div>
        )}
        {item.cta && item.cta.length > 0 && (
            <div className="mt-3 flex gap-2">
                {item.cta.map((c, i) => (
                    <button 
                        key={i}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (c.action === 'make_offer') {
                                onNavigateToTrade?.();
                            }
                        }}
                        className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-full hover:bg-white/20 transition-colors shadow-sm active:scale-95"
                    >
                        {c.label}
                    </button>
                ))}
            </div>
        )}
    </FeedPostLayout>
);

const Sparkline = ({ data, color = "stroke-emerald-400" }: { data: number[], color?: string }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="h-full w-full">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <polyline 
                    points={points} 
                    fill="none" 
                    strokeWidth="3" 
                    vectorEffect="non-scaling-stroke" 
                    className={color} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />
            </svg>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdateProfile, collection, currency, setCurrency, onLogout, onOpenImport, onUpgrade, onNotify, onNavigateToTrade, onCardClick, initialTab }) => {
  const [subView, setSubView] = useState<SubView>('main');
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [tempAvatar, setTempAvatar] = useState(profile.avatar);
  const [tempSocials, setTempSocials] = useState(profile.socials || {});
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Network State
  const { mockFriends } = useMockData();
  const [activeNetworkTab, setActiveNetworkTab] = useState<'feed' | 'roster' | 'find'>('feed');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fleaSessions, setFleaSessions] = useState<FleaSession[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);

  // Mock Settings State
  const [haptics, setHaptics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [streamerMode, setStreamerMode] = useState(false);

  // Cloud Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(localStorage.getItem('kado_last_backup'));

  // Missing State Variables
  const [viewMode, setViewMode] = useState<'passport' | 'net'>('net');
  const [settingsPage, setSettingsPage] = useState<string | null>(null);
  const [hunterTab, setHunterTab] = useState<'feed' | 'network'>(initialTab === 'network' ? 'network' : 'feed');
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  
  // Feed State
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedFilter, setFeedFilter] = useState('Pulse');
  const [feedSort, setFeedSort] = useState<'score' | 'recent'>('score');
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
  const [activeChannels, setActiveChannels] = useState<Set<string>>(new Set(mockNewsChannels.map(c => c.id)));
  const [feedInteractions, setFeedInteractions] = useState<Record<string, InteractionState>>({});

  // Network State
  const [networkSearch, setNetworkSearch] = useState('');
  const [networkSort, setNetworkSort] = useState<'value' | 'score' | 'recent'>('value');


  useEffect(() => {
    const saved = localStorage.getItem('fleaSessions');
    if (saved) {
        try { setFleaSessions(JSON.parse(saved)); } catch(e){}
    }
    const items = generateHunterFeed();
    setFeedItems(items);
  }, []);

   useEffect(() => {
    const initialInteractions: Record<string, InteractionState> = {};
    feedItems.forEach(item => {
        initialInteractions[item.id] = {
            comments: Math.floor(Math.random() * 25),
            repeats: Math.floor(Math.random() * 10),
            likes: Math.floor(Math.random() * 150),
            userRepeated: false,
            userLiked: false,
        };
    });
    setFeedInteractions(initialInteractions);
  }, [feedItems]);

  const handleSave = () => {
    onUpdateProfile({ 
        ...profile, 
        name: tempName, 
        avatar: tempAvatar,
        socials: tempSocials 
    });
    setIsEditing(false);
    onNotify?.("Identity updated.");
  };
  
  const handleCloudBackup = () => {
      if (!profile.isPro) {
          onUpgrade?.();
          return;
      }
      
      setIsBackingUp(true);
      // Simulate API
      setTimeout(() => {
          const dateStr = new Date().toLocaleString();
          localStorage.setItem('kado_last_backup', dateStr);
          setLastBackup(dateStr);
          setIsBackingUp(false);
          onNotify?.("Collection successfully synced to Kado Cloud.");
      }, 2000);
  };

  const handleToggleChannel = (id: string) => {
      const newSet = new Set(activeChannels);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setActiveChannels(newSet);
  };

  const handleFeedAction = (type: 'save' | 'hide', id: string) => {
      if (type === 'save') {
          const newSet = new Set(savedItemIds);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          setSavedItemIds(newSet);
          onNotify?.(newSet.has(id) ? "Item saved" : "Removed from saved");
      } else {
          onNotify?.("Signal hidden");
      }
  };

  const handleFeedInteraction = async (itemId: string, action: 'repeat' | 'like' | 'comment' | 'share') => {
    if (navigator.vibrate) navigator.vibrate(10);

    const item = feedItems.find(i => i.id === itemId);

    if (action === 'share') {
        const text = item ? (item.body || item.message || '') : 'Check out this signal on Kado Hunter';
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Kado Hunter Signal',
                    text: text,
                    url: window.location.href
                });
                onNotify?.("Shared to external network");
            } catch (e) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback
            try {
                await navigator.clipboard.writeText(`${text} ${window.location.href}`);
                onNotify?.("Link copied to clipboard");
            } catch(e) {
                onNotify?.("Could not share");
            }
        }
        return;
    }

    if (action === 'comment') {
        const comment = prompt("Enter your comment:");
        if (comment) {
            onNotify?.("Comment added to discussion");
        } else {
            return; // Cancelled
        }
    }

    setFeedInteractions(prev => {
        const current = prev[itemId] || { 
            comments: item?.initialInteractions?.comments || 0, 
            repeats: item?.initialInteractions?.repeats || 0, 
            likes: item?.initialInteractions?.likes || 0, 
            userRepeated: false, 
            userLiked: false 
        };
        const newState = { ...prev };

        if (action === 'repeat') {
            const isRepeating = !current.userRepeated;
            newState[itemId] = {
                ...current,
                repeats: isRepeating ? current.repeats + 1 : current.repeats - 1,
                userRepeated: isRepeating,
            };
            if (isRepeating) onNotify?.("Signal boosted to network");
        } else if (action === 'like') {
            const isLiking = !current.userLiked;
            newState[itemId] = {
                ...current,
                likes: isLiking ? current.likes + 1 : current.likes - 1,
                userLiked: isLiking,
            };
        } else if (action === 'comment') {
            newState[itemId] = {
                ...current,
                comments: current.comments + 1,
            };
        }
        return newState;
    });
  };
  
  const handleExport = () => {
      const headers = ['Name', 'Set', 'Number', 'Quantity', 'Price', 'Condition', 'Date Added'];
      const rows = collection.map(c => [
          `"${c.name}"`,
          `"${c.set}"`,
          `"${c.number}"`,
          c.quantity || 1,
          c.price,
          c.condition || 'NM',
          c.dateAdded
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kado-collection-export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
  };

  const handleInviteClick = () => {
     let sessionsToUse = fleaSessions;
     if (sessionsToUse.length === 0) {
         // Create ephemeral mock session for the UI if none exists so users can see the feature
         const demoSession: FleaSession = {
             id: `temp-session-${Date.now()}`,
             name: 'Current Market Session',
             date: new Date().toISOString(),
             cards: [],
             totalValue: 0,
             status: 'active'
         };
         sessionsToUse = [demoSession];
     }
     setFleaSessions(sessionsToUse);
     setIsShareModalOpen(true);
  };

  const confirmShare = (session: FleaSession) => {
      setIsShareModalOpen(false);
      onNotify?.(`Invitation sent to ${selectedFriend?.name} to join "${session.name}"`);
  };

  const handleInternalAdd = (id: string) => {
      onNotify?.(`Request sent to ${id}. Awaiting approval.`);
  };

  const handleShareInvite = async () => {
      const inviteText = `Join the hunt on Kado! Add ${profile.name} to your network.`;
      const shareData = {
          title: 'Kado Hunter Invite',
          text: inviteText,
          url: `https://kado.gg/invite/${profile.name}`
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
              onNotify?.("Invite opened in external app");
          } catch (err) {
              console.log("Share cancelled or failed", err);
          }
      } else {
          // Fallback
          try {
            await navigator.clipboard.writeText(`${inviteText} ${shareData.url}`);
            onNotify?.("Invite link copied to clipboard");
          } catch (e) {
            onNotify?.("Could not copy invite link");
          }
      }
  };

  const filteredFeed = useMemo(() => {
      let items = feedItems;
      if (feedFilter === 'Saved') {
          items = items.filter(i => savedItemIds.has(i.id));
      } else if (feedFilter === 'News') {
          items = items.filter(i => i.type === 'news');
      } else if (feedFilter === 'Trades') {
          items = items.filter(i => i.brokerType === 'trade_match');
      } else if (feedFilter === 'Market') {
          items = items.filter(i => i.brokerType === 'market_alert' || i.brokerType === 'sector_intel');
      }
      
      return items.sort((a, b) => {
          if (feedSort === 'score') return b.score - a.score;
          return new Date(b.createdAt.replace(' ago', ' minutes ago')).getTime() - new Date(a.createdAt.replace(' ago', ' minutes ago')).getTime();
      });
  }, [feedItems, feedFilter, feedSort, savedItemIds]);

  const renderIdentityView = () => (
      <div className="flex-1 w-full overflow-y-auto no-scrollbar relative scroll-smooth">
          <div className="p-6 flex flex-col items-center w-full max-w-lg mx-auto pb-24 space-y-6">
              <HunterLicenseCard profile={profile} onShare={() => onNotify?.("Identity shared")} />
              
              {/* Actions Row */}
              <div className="grid grid-cols-2 gap-3 w-full animate-slide-up" style={{animationDelay: '0.1s'}}>
                 <button onClick={onLogout} className="py-3 px-4 bg-navy/50 border border-white/5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all flex items-center justify-center gap-2 group">
                     <Icons.LogIn size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> 
                     Log Out
                 </button>
                 <button onClick={() => setShowFeedback(true)} className="py-3 px-4 bg-navy/50 border border-white/5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 group">
                     <Icons.MessageSquare size={14} className="group-hover:scale-110 transition-transform" />
                     Feedback
                 </button>
              </div>

              {/* Identity & Socials Editor */}
              <div className="w-full bg-navy/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.15s'}}>
                  <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identity & Socials</h3>
                      <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-umber font-bold hover:underline transition-all">{isEditing ? 'Done' : 'Edit'}</button>
                  </div>
                  
                  {isEditing ? (
                      <div className="p-4 space-y-3 bg-white/[0.01]">
                          
                          {/* Avatar Picker */}
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Avatar</label>
                              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                  {AVATARS.map((av) => (
                                      <button 
                                        key={av.id}
                                        onClick={() => setTempAvatar(av.id)}
                                        className={`w-10 h-10 rounded-full shrink-0 ${av.bg} transition-all relative group
                                            ${tempAvatar === av.id ? 'ring-2 ring-umber scale-110' : 'opacity-70 hover:opacity-100'}
                                        `}
                                        title={av.label}
                                      >
                                          {tempAvatar === av.id && (
                                              <div className="absolute inset-0 flex items-center justify-center">
                                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                              </div>
                                          )}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Codename</label>
                              <input 
                                value={tempName} 
                                onChange={e => setTempName(e.target.value)} 
                                className="w-full bg-midnight/50 border border-white/10 rounded-lg p-2 text-sm text-light-slate mt-1 focus:border-umber outline-none" 
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Twitter / X</label>
                              <input 
                                  value={tempSocials.twitter || ''} 
                                  onChange={e => setTempSocials({...tempSocials, twitter: e.target.value})} 
                                  placeholder="@username"
                                  className="w-full bg-midnight/50 border border-white/10 rounded-lg p-2 text-sm text-light-slate mt-1 focus:border-umber outline-none" 
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Discord</label>
                              <input 
                                  value={tempSocials.discord || ''} 
                                  onChange={e => setTempSocials({...tempSocials, discord: e.target.value})} 
                                  placeholder="username"
                                  className="w-full bg-midnight/50 border border-white/10 rounded-lg p-2 text-sm text-light-slate mt-1 focus:border-umber outline-none" 
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Website</label>
                              <input 
                                  value={tempSocials.website || ''} 
                                  onChange={e => setTempSocials({...tempSocials, website: e.target.value})} 
                                  placeholder="kado.gg"
                                  className="w-full bg-midnight/50 border border-white/10 rounded-lg p-2 text-sm text-light-slate mt-1 focus:border-umber outline-none" 
                              />
                          </div>
                          <button onClick={handleSave} className="w-full py-2 bg-umber text-midnight font-bold rounded-lg text-xs mt-2 hover:bg-umber-dark transition-colors">Save Changes</button>
                      </div>
                  ) : (
                      <div className="p-4">
                          <p className="text-xs text-slate-400 mb-3">Social links visible on Hunter License.</p>
                          <div className="space-y-2">
                              {/* Display List of Socials */}
                              {profile.socials?.twitter && (
                                  <div className="flex items-center gap-3 p-2 rounded-lg bg-midnight/30 border border-white/5">
                                      <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                          <Icons.MessageCircle size={14} />
                                      </div>
                                      <span className="text-sm font-mono text-slate-300">{profile.socials.twitter}</span>
                                  </div>
                              )}
                              {profile.socials?.discord && (
                                  <div className="flex items-center gap-3 p-2 rounded-lg bg-midnight/30 border border-white/5">
                                      <div className="w-6 h-6 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                          <Icons.MessageSquare size={14} />
                                      </div>
                                      <span className="text-sm font-mono text-slate-300">{profile.socials.discord}</span>
                                  </div>
                              )}
                              {profile.socials?.website && (
                                  <div className="flex items-center gap-3 p-2 rounded-lg bg-midnight/30 border border-white/5">
                                      <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                          <Icons.Globe size={14} />
                                      </div>
                                      <span className="text-sm font-mono text-slate-300">{profile.socials.website}</span>
                                  </div>
                              )}
                              {(!profile.socials || Object.values(profile.socials).every(v => !v)) && (
                                  <p className="text-xs text-slate-500 italic">No social links added.</p>
                              )}
                          </div>
                      </div>
                  )}
              </div>

              {/* System Preferences */}
              <div className="w-full bg-navy/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.2s'}}>
                  <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Preferences</h3>
                  </div>
                  
                  <div className="p-2 space-y-1">
                      {/* Theme */}
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-midnight border border-white/10 flex items-center justify-center text-amber-400">
                                  <Icons.Eye size={16} />
                              </div>
                              <span className="text-sm font-bold text-slate-300">App Theme</span>
                          </div>
                          <div className="flex bg-midnight p-0.5 rounded-lg border border-white/10">
                             <button className="px-3 py-1.5 bg-white/10 rounded-md text-[10px] font-bold text-white shadow-sm transition-all">Dark</button>
                             <button className="px-3 py-1.5 rounded-md text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-all">Light</button>
                          </div>
                      </div>

                      {/* Haptics - New "etc" item */}
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-midnight border border-white/10 flex items-center justify-center text-purple-400">
                                  <Icons.Zap size={16} />
                              </div>
                              <span className="text-sm font-bold text-slate-300">Haptics</span>
                          </div>
                          <button 
                            onClick={() => setHaptics(!haptics)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${haptics ? 'bg-purple-500' : 'bg-slate-700'}`}
                          >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${haptics ? 'left-6' : 'left-1'}`}></div>
                          </button>
                      </div>

                      {/* Cloud Sync */}
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-midnight border border-white/10 flex items-center justify-center text-blue-400">
                                  <Icons.UploadCloud size={16} />
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-300">Cloud Sync</span>
                                  <span className="text-[10px] text-slate-500">{lastBackup ? `Synced ${lastBackup}` : 'Not synced'}</span>
                              </div>
                          </div>
                          <button 
                            onClick={handleCloudBackup}
                            disabled={isBackingUp}
                            className={`p-2 rounded-lg transition-colors border ${isBackingUp ? 'bg-blue-500/20 border-blue-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'}`}
                          >
                             {isBackingUp ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> : <Icons.Repeat size={16} />}
                          </button>
                      </div>
                  </div>
              </div>

              {/* Data & Account */}
              <div className="w-full bg-navy/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.3s'}}>
                   <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data & Account</h3>
                  </div>
                  <div className="p-2 space-y-1">
                      {/* Import */}
                      <button onClick={onOpenImport} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-midnight border border-white/10 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 group-hover:border-emerald-500/30 transition-colors">
                                  <Icons.FolderInput size={16} />
                              </div>
                              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Import Collection</span>
                           </div>
                           <Icons.ChevronRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                      </button>

                      {/* Export */}
                      <button onClick={handleExport} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-midnight border border-white/10 flex items-center justify-center text-purple-400 group-hover:text-purple-300 group-hover:border-purple-500/30 transition-colors">
                                  <Icons.Download size={16} />
                              </div>
                              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Export CSV</span>
                           </div>
                           <Icons.ChevronRight size={14} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
                      </button>

                       <div className="h-px bg-white/5 my-1 mx-2"></div>

                       {/* Delete Account */}
                       <button 
                        onClick={() => {
                            if(confirm("DANGER: This will permanently delete your account and all data. This action cannot be undone.")) {
                                onLogout?.();
                                onNotify?.("Account deletion scheduled.");
                            }
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-rose-500/10 transition-colors group"
                       >
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-rose-500/5 border border-rose-500/20 flex items-center justify-center text-rose-500 group-hover:bg-rose-500/20 transition-colors">
                                  <Icons.Trash2 size={16} />
                              </div>
                              <span className="text-sm font-bold text-rose-400 group-hover:text-rose-300 transition-colors">Delete Account</span>
                           </div>
                      </button>
                  </div>
              </div>

              {/* Version Info */}
              <div className="text-center pt-4 opacity-50 animate-fade-in" style={{animationDelay: '0.4s'}}>
                  <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Kado Hunter v2.5.0 • Build 8842</p>
              </div>

          </div>
          <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      </div>
  );

  const filteredFriends = useMemo(() => {
      let filtered = mockFriends.filter(f => 
          f.name.toLowerCase().includes(networkSearch.toLowerCase()) || 
          f.id.toLowerCase().includes(networkSearch.toLowerCase())
      );
      
      if (networkSort === 'value') {
          filtered.sort((a, b) => b.collectionValue - a.collectionValue);
      } else if (networkSort === 'score') {
          filtered.sort((a, b) => b.level - a.level);
      } else if (networkSort === 'recent') {
          // Mock recent activity sort - just arbitrary for now
          filtered.sort((a, b) => (a.status === 'online' ? -1 : 1));
      }
      return filtered;
  }, [networkSearch, networkSort]);

  const renderNetworkView = () => (
      <div className="p-4 lg:p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Friends & Network</h2>
              <button 
                onClick={() => setIsAddFriendOpen(true)}
                className="px-3 py-1.5 bg-umber text-midnight font-bold rounded-lg text-xs hover:bg-umber-dark transition-colors flex items-center gap-2"
              >
                  <Icons.UserPlus size={14} />
                  Add Friend
              </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 relative">
                  <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                      type="text" 
                      placeholder="Search Codename or ID..." 
                      value={networkSearch}
                      onChange={(e) => setNetworkSearch(e.target.value)}
                      className="w-full bg-navy/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-umber/50 transition-colors"
                  />
              </div>
              <div className="relative shrink-0">
                  <select 
                      value={networkSort}
                      onChange={(e) => setNetworkSort(e.target.value as any)}
                      className="appearance-none bg-navy/40 border border-white/10 rounded-xl py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none focus:border-umber/50 transition-colors cursor-pointer"
                  >
                      <option value="value">Value</option>
                      <option value="score">Hunter Score</option>
                      <option value="recent">Recent Activity</option>
                  </select>
                  <Icons.ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
              </div>
          </div>
          
          <div className="space-y-3">
              {filteredFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 bg-navy/40 border border-white/5 rounded-xl hover:bg-navy/60 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className="relative">
                              <div className={`w-10 h-10 rounded-full ${getAvatarBg(friend.avatar)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                  {friend.name.substring(0, 1)}
                              </div>
                              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-midnight ${friend.status === 'online' ? 'bg-emerald-500' : friend.status === 'away' ? 'bg-amber-500' : 'bg-slate-500'}`}></div>
                          </div>
                          <div>
                              <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{friend.name}</p>
                              <p className="text-[10px] text-slate-400">Lvl {friend.level} • {friend.cardCount} Cards</p>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Value</p>
                              <p className="text-xs font-mono font-bold text-white">${friend.collectionValue.toLocaleString()}</p>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToTrade?.();
                            }}
                            className="h-9 px-4 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-midnight border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-500 transition-all active:scale-95 shadow-sm group/invite"
                            title="Quick Trade"
                          >
                              <Icons.Repeat size={16} />
                              <span className="text-xs font-bold whitespace-nowrap">Quick Trade</span>
                          </button>
                      </div>
                  </div>
              ))}
          </div>

          <SessionShareModal 
            isOpen={isShareModalOpen} 
            onClose={() => setIsShareModalOpen(false)} 
            sessions={fleaSessions} 
            friendName={selectedFriend?.name || 'Friend'} 
            onShare={confirmShare} 
          />
      </div>
  );

  const renderDesktopWidgets = () => <div className="text-center text-slate-500 text-xs">Widgets</div>;

  const renderHunterFeed = () => (
      <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pb-32 md:pb-6 no-scrollbar relative">
              <div className="sticky top-0 z-10 bg-[#050e1c] pt-3 pb-2 px-0 border-b border-white/5">
                  <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between px-4">
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                          {['Pulse', 'Trades', 'Market', 'News', 'Saved'].map(f => (
                              <button 
                                key={f}
                                onClick={() => setFeedFilter(f)}
                                className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border whitespace-nowrap ${feedFilter === f ? 'bg-white text-midnight border-white shadow-md' : 'bg-navy/40 text-slate-500 border-white/10 hover:border-white/30 hover:text-slate-300'}`}
                              >
                                  {f}
                              </button>
                          ))}
                      </div>
                      
                      <div className="flex items-center gap-3 text-[10px] font-bold shrink-0 uppercase tracking-wider pl-1 justify-end w-full md:w-auto">
                          {(feedFilter === 'News' || feedFilter === 'Pulse') && (
                              <button 
                                onClick={() => setIsTunerOpen(true)}
                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors mr-2 px-2 py-1 rounded hover:bg-blue-500/10"
                              >
                                  <Icons.SlidersHorizontal size={12} />
                                  <span>Tune Signal</span>
                              </button>
                          )}

                          <span className="text-slate-500">Sort by</span>
                          <button onClick={() => setFeedSort('score')} className={`transition-colors ${feedSort === 'score' ? 'text-white border-b border-amber-500' : 'hover:text-slate-300'}`}>Score</button>
                          <button onClick={() => setFeedSort('recent')} className={`transition-colors ${feedSort === 'recent' ? 'text-white border-b border-amber-500' : 'hover:text-slate-300'}`}>Recent</button>
                      </div>
                  </div>
              </div>

              <div className="space-y-0">
                  {/* Daily Brief Special Item */}
                  {feedFilter === 'Pulse' && (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-b border-white/5 relative">
                        <div className="w-1 h-full absolute left-0 top-0 bg-indigo-500"></div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-0.5">Daily Brief</p>
                            <p className="text-xs text-slate-300 truncate">3 high-value opportunities detected in your network.</p>
                        </div>
                        <button className="p-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg text-indigo-300 transition-colors">
                            <Icons.ChevronRight size={16} />
                        </button>
                    </div>
                  )}

                  {filteredFeed.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 opacity-50">
                          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                              <Icons.Activity size={24} className="text-slate-500" />
                          </div>
                          <p className="text-xs font-bold text-slate-400">No signals found.</p>
                          {(feedFilter === 'News' || feedFilter === 'Pulse') && (
                              <button onClick={() => setIsTunerOpen(true)} className="mt-2 text-[10px] text-blue-400 hover:underline">
                                  Adjust Signal Tuner
                              </button>
                          )}
                      </div>
                  )}

                  {filteredFeed.map((item) => {
                      const isSaved = savedItemIds.has(item.id);
                      const interactions = feedInteractions[item.id] || { 
                          comments: item.initialInteractions?.comments || 0, 
                          repeats: item.initialInteractions?.repeats || 0, 
                          likes: item.initialInteractions?.likes || 0, 
                          userRepeated: false, 
                          userLiked: false 
                      };

                      if (item.type === 'news') return <NewsCard key={item.id} item={item} interactions={interactions} onInteract={handleFeedInteraction} onCardClick={onCardClick} />;
                      if (item.brokerType === 'trade_match') return <TradeMatchCard key={item.id} item={item} isSaved={isSaved} interactions={interactions} onAction={handleFeedAction} onInteract={handleFeedInteraction} onNavigateToTrade={onNavigateToTrade} onCardClick={onCardClick} />;
                      if (item.type === 'broker') return <IntelCard key={item.id} item={item} isSaved={isSaved} interactions={interactions} onAction={handleFeedAction} onInteract={handleFeedInteraction} onNavigateToTrade={onNavigateToTrade} onCardClick={onCardClick} />;
                      if (item.type === 'finding') return <UserFindingCard key={item.id} item={item} interactions={interactions} onInteract={handleFeedInteraction} onNavigateToTrade={onNavigateToTrade} onCardClick={onCardClick} />;
                      return null;
                  })}
                  
                  {filteredFeed.length > 0 && (
                    <div className="py-8 text-center text-xs text-slate-600 font-mono uppercase tracking-widest opacity-50">
                        End of Signal
                    </div>
                  )}
              </div>
          </div>
      </div>
  );

  return (
    <div className="h-full bg-gradient-to-b from-midnight to-[#050e1c] overflow-hidden">
      
      <OracleModal isOpen={isOracleOpen} onClose={() => setIsOracleOpen(false)} collectionContext={collection} />
      <AddFriendModal isOpen={isAddFriendOpen} onClose={() => setIsAddFriendOpen(false)} onAdd={handleInternalAdd} onShare={handleShareInvite} />
      
      <SignalTunerModal 
          isOpen={isTunerOpen} 
          onClose={() => setIsTunerOpen(false)} 
          channels={mockNewsChannels || []}
          activeChannels={activeChannels}
          onToggle={handleToggleChannel}
      />

      <div className="h-full flex justify-center bg-transparent relative overflow-hidden">
        <div className="w-full max-w-3xl h-full flex flex-col bg-[#050e1c] border-x border-white/5 shadow-2xl relative z-10">
          
          <header className="px-4 md:px-6 pt-6 pb-2 bg-[#050e1c] shrink-0 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg ring-1 ring-white/10 shrink-0">
                <Icons.Globe size={20} className="text-white" />
              </div>
              <div className="min-w-0 overflow-hidden">
                <h1 className="text-lg md:text-xl font-black text-white tracking-tight leading-none whitespace-nowrap truncate">HUNTER NET</h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">Updated 1m ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-2 shrink-0">
                 <button 
                    onClick={() => {
                        if (viewMode === 'passport') {
                            setViewMode('net');
                            setSettingsPage(null);
                        } else {
                            setViewMode('passport');
                        }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all active:scale-95 shrink-0
                        ${viewMode === 'passport' 
                            ? 'bg-white text-midnight border-white' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'}
                    `}
                 >
                     <div className={`w-2 h-2 rounded-full ${viewMode === 'passport' ? 'bg-midnight' : 'bg-rose-500'} animate-pulse`}></div>
                     <span className="text-xs font-black tracking-widest uppercase whitespace-nowrap">
                         {viewMode === 'passport' ? 'GO BACK' : 'ID • SETTINGS'}
                     </span>
                 </button>
            </div>
          </header>

          {viewMode === 'passport' ? (
              renderIdentityView()
          ) : (
              <>
                <div className="flex items-center justify-between border-b border-white/5 px-4 pt-2 pb-0 shrink-0 bg-[#050e1c]/95 backdrop-blur-md sticky top-[72px] z-20">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'feed', label: 'Pulse', icon: Icons.Activity },
                            { id: 'network', label: 'Friends', icon: Icons.Users },
                        ].map((tab) => {
                            const isActive = hunterTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button 
                                key={tab.id}
                                onClick={() => setHunterTab(tab.id as any)}
                                className={`pb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${isActive ? 'text-white border-umber' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                                >
                                    <Icon size={14} /> 
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                    
                    <button 
                        onClick={() => setIsOracleOpen(true)}
                        className="flex items-center gap-2 pb-2 pl-4 text-umber hover:text-amber-300 transition-colors active:scale-95 group"
                    >
                        <Icons.Zap size={14} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black tracking-widest uppercase whitespace-nowrap">Ask Sage</span>
                    </button>
                </div>
                {hunterTab === 'feed' && renderHunterFeed()}
                {hunterTab === 'network' && renderNetworkView()}
              </>
          )}
        </div>

        <div className="hidden xl:block w-80 pl-6 py-6 pr-6 overflow-y-auto no-scrollbar shrink-0">
            {viewMode === 'passport' ? (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="bg-navy/40 border border-white/5 rounded-2xl p-4">
                        <h3 className="text-sm font-bold text-light-slate mb-3 flex items-center gap-2"><Icons.CheckCircle size={14} className="text-emerald-400" /> Score Boosters</h3>
                        <div className="space-y-2">
                            {[
                                { label: 'Verify Identity', done: true },
                                { label: 'Link TCGplayer Account', done: false },
                                { label: 'Set Shipping Preferences', done: true },
                                { label: 'Scan 50 Cards', done: true }
                            ].map((task, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${task.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                                        {task.done ? <Icons.Check size={10}/> : <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>}
                                    </div>
                                    <span className="text-xs text-slate-300">{task.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : renderDesktopWidgets()}
        </div>
      </div>
    </div>
  );
};
