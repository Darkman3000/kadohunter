import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Icons } from './Icons';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('feature');
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsSending(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setText('');
        onClose();
      }, 2000);
    }, 1500);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center px-4 pb-6 sm:p-6">
      <div className="absolute inset-0 bg-midnight/80 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-navy border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-midnight/30">
          <div>
             <h2 className="text-lg font-bold text-light-slate">Send Feedback</h2>
             <p className="text-xs text-slate-text">Help us improve the Hunter experience.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-text">
            <Icons.Close size={20} />
          </button>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <Icons.Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Feedback Received</h3>
              <p className="text-sm text-slate-text">Thank you for your contribution, Hunter.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-text uppercase tracking-wider ml-1">Feedback Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('feature')}
                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${type === 'feature' ? 'bg-umber text-midnight border-umber' : 'bg-midnight border-white/10 text-slate-text hover:bg-white/5'}`}
                  >
                    Feature
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('bug')}
                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${type === 'bug' ? 'bg-rose-500 text-white border-rose-500' : 'bg-midnight border-white/10 text-slate-text hover:bg-white/5'}`}
                  >
                    Bug Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('other')}
                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${type === 'other' ? 'bg-white text-midnight border-white' : 'bg-midnight border-white/10 text-slate-text hover:bg-white/5'}`}
                  >
                    Other
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-text uppercase tracking-wider ml-1">Message</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={type === 'bug' ? "Describe the issue..." : "Tell us your idea..."}
                  required
                  className="w-full h-32 bg-midnight/50 border border-white/10 rounded-xl p-4 text-sm text-light-slate placeholder-slate-text/50 focus:outline-none focus:border-umber transition-colors resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSending || !text.trim()}
                className="w-full py-3.5 rounded-xl bg-umber text-midnight font-bold shadow-lg hover:bg-umber-dark hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSending ? (
                   <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin"></div>
                ) : (
                   <>
                     <Icons.MessageSquare size={18} />
                     <span>Submit Feedback</span>
                   </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};