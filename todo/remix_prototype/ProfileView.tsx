import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Card, Currency, Achievement, MarketSource, Friend, FleaSession } from '../types';
import { Icons } from './Icons';
import { FeedbackModal } from './FeedbackModal';
import { useMockData, formatCurrency } from '../services/mockDataService';

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

// Mock Data
const MOCK_LOGS = [
  { id: 1, type: 'scan', title: 'New Discovery', detail: 'Scanned "Charizard ex"', date: 'Today, 10:23 AM', amount: 24.55, isPositive: true },
  { id: 2, type: 'trade', title: 'Trade Completed', detail: 'Traded with User @Kai', date: 'Yesterday, 4:15 PM', amount: 0, isPositive: true },
  { id: 3, type: 'update', title: 'Portfolio Update', detail: 'Daily market adjustment', date: 'Yesterday, 9:00 AM', amount: -12.40, isPositive: false },
  { id: 4, type: 'scan', title: 'New Discovery', detail: 'Scanned "Black Lotus"', date: 'Oct 24, 2:00 PM', amount: 25000.00, isPositive: true },
  { id: 5, type: 'settings', title: 'Currency Changed', detail: 'Switched to EUR', date: 'Oct 20, 11:30 AM', amount: 0, isPositive: true },
];

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: '1', name: 'Novice Hunter', icon: 'Scan', unlocked: true },
  { id: '2', name: 'Market Mogul', icon: 'TrendingUp', unlocked: true },
  { id: '3', name: 'Big Spender', icon: 'ShoppingBag', unlocked: false },
  { id: '4', name: 'Master Trader', icon: 'Trade', unlocked: false },
  { id: '5', name: 'Collector Elite', icon: 'Trophy', unlocked: false },
  { id: '6', name: 'Early Adopter', icon: 'Star', unlocked: true },
];

// Mock Feed Data for "Hunter Net"
const FEED_POSTS = [
    {
        id: 1,
        author: 'BROKER_X',
        time: '20m ago',
        content: 'Massive spike in Base Set holographic volume detected in Sector 4. Someone is cornering the market.',
        type: 'alert',
        avatar: 'dusk',
        color: 'text-umber'
    },
    {
        id: 2,
        author: 'KAI',
        time: '2h ago',
        content: 'Found a pristine Black Lotus at the underground swap. The seller didn\'t know what they had.',
        type: 'finding',
        image: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg?1614638838',
        avatar: 'sky',
        color: 'text-emerald-400'
    },
    {
        id: 3,
        author: 'SYSTEM',
        time: '1d ago',
        content: 'Weekly Market Analysis: Bearish trends on modern sets. Liquidity moving to vintage artifacts.',
        type: 'system',
        avatar: 'gold',
        color: 'text-amber-400'
    },
    {
        id: 4,
        author: 'DEEP_WEB',
        time: '3d ago',
        content: 'WARNING: Counterfeit "Moonbreon" copies circulating in the Eastern District. Check the foil pattern carefully.',
        type: 'warning',
        avatar: 'mint',
        color: 'text-rose-400'
    }
];

const SessionShareModal = ({ isOpen, onClose, sessions, friendName, onShare }: { isOpen: boolean, onClose: () => void, sessions: FleaSession[], friendName: string, onShare: (s: FleaSession) => void }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="bg-navy border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-light-slate">Select Mission</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-text hover:text-white transition-colors"><Icons.Close size={20} /></button>
                </div>
                <p className="text-xs text-slate-text mb-4">Invite <span className="text-white font-bold">{friendName}</span> to collaborate on:</p>
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
            </div>
        </div>
    )
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdateProfile, collection, currency, setCurrency, onLogout, onOpenImport, onUpgrade, onNotify }) => {
  const [subView, setSubView] = useState<SubView>('main');
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [tempAvatar, setTempAvatar] = useState(profile.avatar);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Network State
  const { mockFriends } = useMockData();
  const [activeNetworkTab, setActiveNetworkTab] = useState<'feed' | 'roster' | 'find'>('feed');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fleaSessions, setFleaSessions] = useState<FleaSession[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Mock Settings State
  const [haptics, setHaptics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [streamerMode, setStreamerMode] = useState(false);

  // Cloud Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(localStorage.getItem('kado_last_backup'));

  const totalValue = useMemo(() => collection.reduce((acc, curr) => acc + curr.price, 0), [collection]);
  const nextLevelXp = 3000;
  const progress = (profile.xp / nextLevelXp) * 100;

  useEffect(() => {
    const saved = localStorage.getItem('fleaSessions');
    if (saved) {
        try { setFleaSessions(JSON.parse(saved)); } catch(e){}
    }
  }, []);

  const handleSave = () => {
    onUpdateProfile({ ...profile, name: tempName, avatar: tempAvatar });
    setIsEditing(false);
  };
  
  const handleExport = () => {
      // PRO check moved to button click
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

  const handleInviteClick = () => {
     if (fleaSessions.length === 0) {
         onNotify?.("No active Flea Market sessions found to share.");
         return;
     }
     setIsShareModalOpen(true);
  };

  const confirmShare = (session: FleaSession) => {
      setIsShareModalOpen(false);
      onNotify?.(`Invitation sent to ${selectedFriend?.name} for "${session.name}"`);
  };

  const activeAvatarStyle = getAvatarBg(isEditing ? tempAvatar : profile.avatar);

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'online': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,