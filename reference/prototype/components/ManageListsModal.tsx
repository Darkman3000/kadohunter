import React, { useState } from 'react';
import { Icons } from './Icons';
import { BinderGroupDef } from '../types';

interface ManageListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: BinderGroupDef[];
  onUpdateGroups: (groups: BinderGroupDef[]) => void;
}

const AVAILABLE_ICONS: (keyof typeof Icons)[] = [
  'Star', 'Zap', 'Binder', 'Flea', 'Trophy', 
  'Eye', 'Layers', 'Globe', 'Repeat', 'Market', 'Trade', 'Profile', 'CheckCircle', 'Bell'
];

export const ManageListsModal: React.FC<ManageListsModalProps> = ({ 
  isOpen, 
  onClose, 
  groups, 
  onUpdateGroups 
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Icons>('Star');

  if (!isOpen) return null;

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: BinderGroupDef = {
      id: newGroupName.toLowerCase().replace(/\s+/g, '-'),
      label: newGroupName,
      icon: selectedIcon,
    };

    onUpdateGroups([...groups, newGroup]);
    setNewGroupName('');
    setSelectedIcon('Star');
  };

  const handleDeleteGroup = (id: string) => {
    onUpdateGroups(groups.filter(g => g.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center px-4 pb-32 sm:p-6">
      <div className="absolute inset-0 bg-midnight/80 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-navy/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[70vh] sm:max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-bold text-light-slate">Manage Lists</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-text hover:text-light-slate">
            <Icons.Close size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
          
          {/* Create New Group */}
          <form onSubmit={handleAddGroup} className="bg-midnight/50 rounded-2xl p-4 border border-white/5">
            <h3 className="text-xs font-bold text-slate-text uppercase tracking-wider mb-3">Create New List</h3>
            
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                 <input 
                    type="text" 
                    placeholder="List Name (e.g. Decks)" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-navy border border-white/10 rounded-xl py-3 px-4 text-light-slate text-sm placeholder-slate-text/50 focus:outline-none focus:border-umber transition-all"
                 />
              </div>
              <button 
                type="submit"
                disabled={!newGroupName.trim()}
                className="w-12 h-12 bg-umber text-midnight rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-umber-dark transition-colors"
              >
                <Icons.Plus size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Icon Picker */}
            <div>
              <p className="text-[10px] font-bold text-slate-text mb-2 uppercase">Select Icon</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map(iconName => {
                  const Icon = Icons[iconName];
                  const isSelected = selectedIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 text-midnight shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-110' : 'bg-navy border border-white/10 text-slate-text hover:text-light-slate hover:bg-white/5'}`}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Existing Lists */}
          <div>
            <h3 className="text-xs font-bold text-slate-text uppercase tracking-wider mb-3">Your Lists</h3>
            <div className="space-y-2">
              {groups.map(group => {
                const Icon = Icons[group.icon as keyof typeof Icons] || Icons.Binder;
                return (
                  <div key={group.id} className="flex items-center justify-between p-3 bg-navy/40 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-midnight border border-white/10 flex items-center justify-center text-emerald-400">
                        <Icon size={14} />
                      </div>
                      <span className="text-sm font-bold text-light-slate">{group.label}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteGroup(group.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-text hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Icons.Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {groups.length === 0 && (
                <p className="text-center text-sm text-slate-text py-4 italic">No custom lists yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};