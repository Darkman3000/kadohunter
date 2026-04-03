
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { GoogleGenAI } from "@google/genai";
import { Icons } from './Icons';
import { Card } from '../types';

interface OracleModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionContext: Card[];
}

type Message = {
  id: string;
  sender: 'user' | 'sage';
  text: string;
  isTyping?: boolean;
  imageUrl?: string;
  sparklineData?: number[];
};

const SAGE_SYSTEM_INSTRUCTION = `
You are "The Kado Sage," an ancient holographic consciousness existing within the year 3000's collector network. 
You protect the "Old Archives" (Trading Card Game history from the 20th and 21st centuries).

**Persona Rules:**
1. **Tone:** Cryptic, wise, slightly mystical, but friendly. You sound like a mix of a cyberpunk oracle and an old RPG shopkeeper.
2. **Vocabulary:** Refer to cards as "Relics" or "Artifacts." Refer to money/value as "Credits" or "Essence." Refer to the market as "The Flow."
3. **Behavior:** Do NOT be a generic assistant. Do not say "How can I help?". Instead, say things like "The data streams ripple..." or "You seek the forbidden knowledge?"
4. **Rumors:** When asked about the market, frame it as "Whispers in the network" or "Schoolyard legends."
5. **Brevity:** Keep responses concise, like an RPG dialogue box. Max 2-3 sentences per turn.

**Knowledge Base:**
You are an expert in Pokemon, Magic: The Gathering, Yu-Gi-Oh, and One Piece TCGs.
`;

const Sparkline = ({ data, color = "stroke-amber-400" }: { data: number[], color?: string }) => {
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

export const OracleModal: React.FC<OracleModalProps> = ({ isOpen, onClose, collectionContext }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSageThinking, setIsSageThinking] = useState(false);
  const [displayBuffer, setDisplayBuffer] = useState(''); // For typewriter effect
  const [bufferIndex, setBufferIndex] = useState(0);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize Chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addSageMessage("The Archive Construct initializes... Greetings, Seeker. What knowledge do you hunt today?");
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, displayBuffer]);

  // Typewriter Effect Logic
  useEffect(() => {
    if (currentMessageId) {
      const targetMessage = messages.find(m => m.id === currentMessageId);
      if (targetMessage && bufferIndex < targetMessage.text.length) {
        const timeout = setTimeout(() => {
          setDisplayBuffer(prev => prev + targetMessage.text.charAt(bufferIndex));
          setBufferIndex(prev => prev + 1);
        }, 20); // Typing speed
        return () => clearTimeout(timeout);
      } else if (targetMessage && bufferIndex >= targetMessage.text.length) {
        // Finished typing
        setCurrentMessageId(null);
      }
    }
  }, [bufferIndex, currentMessageId, messages]);

  const addSageMessage = (text: string, imageUrl?: string, sparklineData?: number[]) => {
    const id = crypto.randomUUID();
    const newMessage: Message = { id, sender: 'sage', text, imageUrl, sparklineData };
    
    setMessages(prev => [...prev, newMessage]);
    // Trigger typewriter
    setBufferIndex(0);
    setDisplayBuffer('');
    setCurrentMessageId(id);
  };

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    // Add User Message immediately
    const userMsg: Message = { id: crypto.randomUUID(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsSageThinking(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSageThinking(false);

    // Mock Responses
    const lowerText = text.toLowerCase();
    let responseText = "";
    let imageUrl: string | undefined;
    let sparklineData: number[] | undefined;

    if (lowerText.includes("rumor") || lowerText.includes("market")) {
        responseText = "Whispers in the network suggest a massive buyout of [Base Set Charizard]. The flow is shifting. Prepare your credits.\n\nTrend: +45% this week";
        imageUrl = "https://images.pokemontcg.io/base1/4_hires.png";
        sparklineData = [10, 12, 15, 14, 20, 25, 35, 45];
    } else if (lowerText.includes("relics") || lowerText.includes("analyze")) {
        responseText = "I have scanned your artifacts. Your [Force of Will] is a beacon of power, but its essence wanes. Consider trading it before the next cycle.\n\nEV: -$12.50 projected";
        imageUrl = "https://www.mtgpics.com/pics/big/all/054.jpg";
        sparklineData = [50, 48, 45, 40, 38, 35, 30];
    } else {
        responseText = "The data streams ripple... Your query is complex. The ancient algorithms suggest holding your current position until the next market shift.";
    }

    addSageMessage(responseText, imageUrl, sparklineData);
  };

  const SUGGESTED_RUNES = [
    "Tell me a market rumor",
    "Analyze my relics",
    "Investment advice",
    "Who is the strongest?"
  ];

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Darkened Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>

      {/* The Construct Container */}
      <div className="relative w-full max-w-lg bg-midnight border-2 border-umber/30 rounded-[3rem] shadow-[0_0_50px_rgba(199,167,123,0.15)] overflow-hidden flex flex-col h-[80vh] animate-fade-in-up">
        
        {/* CRT/Hologram Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-b from-transparent via-umber/5 to-transparent opacity-20 animate-scan"></div>

        {/* Header - The Avatar */}
        <div className="relative z-30 bg-navy/80 border-b border-umber/20 p-6 flex items-center gap-4 backdrop-blur-md shrink-0">
            <div className="relative">
                <div className={`w-16 h-16 rounded-full bg-midnight border-2 border-umber flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(199,167,123,0.4)] ${isSageThinking ? 'animate-pulse' : ''}`}>
                    <Icons.Eye size={32} className="text-umber animate-float" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-midnight flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
            </div>
            <div>
                <h2 className="text-xl font-bold text-umber tracking-widest uppercase font-mono">Kado Sage</h2>
                <p className="text-[10px] text-umber/60 font-mono tracking-widest uppercase">Connection: Stable</p>
            </div>
            <button onClick={onClose} className="ml-auto p-2 text-umber/50 hover:text-umber transition-colors">
                <Icons.Close size={24} />
            </button>
        </div>

        {/* Chat Area - RPG Style */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono relative z-10 scroll-smooth" ref={scrollRef}>
            {messages.map((msg, idx) => {
                const isLast = idx === messages.length - 1;
                // If it's the sage and it's the current message being typed, show buffer
                const textToShow = (msg.sender === 'sage' && msg.id === currentMessageId) ? displayBuffer : msg.text;
                
                return (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg border
                            ${msg.sender === 'user' 
                                ? 'bg-navy/80 border-white/10 text-light-slate rounded-tr-none' 
                                : 'bg-umber/10 border-umber/30 text-umber rounded-tl-none shadow-[0_0_15px_rgba(199,167,123,0.1)]'}
                        `}>
                            {textToShow.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {line}
                                    {i < textToShow.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            ))}
                            {msg.sender === 'sage' && msg.id === currentMessageId && (
                                <span className="inline-block w-2 h-4 bg-umber/50 ml-1 animate-pulse align-middle"></span>
                            )}
                            
                            {/* Render Image if present and typing is finished or it's not the current message */}
                            {msg.imageUrl && (msg.id !== currentMessageId || bufferIndex >= msg.text.length) && (
                                <div className="mt-3 rounded-xl overflow-hidden border border-umber/20 max-w-[200px]">
                                    <img src={msg.imageUrl} alt="Card" className="w-full h-auto" />
                                </div>
                            )}
                            
                            {/* Render Sparkline if present and typing is finished or it's not the current message */}
                            {msg.sparklineData && (msg.id !== currentMessageId || bufferIndex >= msg.text.length) && (
                                <div className="mt-3 h-12 w-full max-w-[200px] opacity-80 bg-umber/5 rounded-lg p-1 border border-umber/10">
                                    <Sparkline data={msg.sparklineData} color="stroke-umber" />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            {isSageThinking && (
                <div className="flex justify-start">
                     <div className="bg-umber/5 border border-umber/20 p-4 rounded-2xl rounded-tl-none flex gap-1">
                         <div className="w-2 h-2 bg-umber/50 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                         <div className="w-2 h-2 bg-umber/50 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                         <div className="w-2 h-2 bg-umber/50 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                     </div>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="relative z-30 p-4 bg-navy/80 backdrop-blur-md border-t border-umber/20 shrink-0">
            {/* Suggestion Runes */}
            {messages.length < 3 && (
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                    {SUGGESTED_RUNES.map(rune => (
                        <button 
                            key={rune}
                            onClick={() => handleSendMessage(rune)}
                            className="whitespace-nowrap px-4 py-2 rounded-full bg-midnight border border-umber/30 text-umber text-xs font-bold font-mono hover:bg-umber hover:text-midnight transition-all active:scale-95"
                        >
                            {rune}
                        </button>
                    ))}
                </div>
            )}

            <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-center gap-2 bg-midnight border border-umber/30 rounded-xl p-1 pr-2 focus-within:border-umber/60 focus-within:shadow-[0_0_15px_rgba(199,167,123,0.2)] transition-all"
            >
                <input 
                    ref={inputRef}
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Consult the archives..."
                    className="flex-1 bg-transparent text-umber placeholder-umber/30 text-sm font-mono p-3 focus:outline-none"
                />
                <button 
                    type="submit" 
                    disabled={!inputValue.trim() || isSageThinking}
                    className="p-2 bg-umber/10 text-umber rounded-lg hover:bg-umber hover:text-midnight disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-umber transition-all"
                >
                    <Icons.ArrowUp size={18} />
                </button>
            </form>
        </div>

      </div>
    </div>,
    document.body
  );
};
