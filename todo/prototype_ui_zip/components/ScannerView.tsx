
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Icons } from './Icons';
import { geminiService } from '../services/geminiService';
import { Card, ScanMode, FleaSession } from '../types';

interface ScannerViewProps {
  onCardScanned: (card: Card) => void;
  onSaveSession?: (session: FleaSession) => void;
  initialMode?: ScanMode;
  onBulkScan?: (cards: Card[]) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onCardScanned, onSaveSession, initialMode = ScanMode.ADD_TO_BINDER, onBulkScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorState, setErrorState] = useState<{ type: 'permission' | 'device' | 'unknown', message: string } | null>(null);
  const [mode, setMode] = useState<ScanMode>(initialMode);

  // Flea Market & Bulk specific state
  const [scannedBatch, setScannedBatch] = useState<Card[]>([]);
  const [isContinuousScan, setIsContinuousScan] = useState(false);
  const [lastScannedCard, setLastScannedCard] = useState<Card | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const continuousScanInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Binder Bulk Toggle
  const [isBulkBinderMode, setIsBulkBinderMode] = useState(false);

  // --- Initialization ---

  const startCamera = useCallback(async () => {
    setErrorState(null);
    let stream: MediaStream | null = null;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorState({ type: 'unknown', message: 'Camera API not supported' });
        return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
    } catch (err: any) {
      console.warn("Environment camera failed, trying default", err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err2: any) {
        console.error("Camera access failed", err2);
        
        // Handle specific error types
        if (err2.name === 'NotAllowedError' || err2.name === 'PermissionDeniedError') {
            setErrorState({ type: 'permission', message: 'Camera access denied. Please grant permission in your browser settings.' });
        } else if (err2.name === 'NotFoundError' || err2.name === 'DevicesNotFoundError') {
            setErrorState({ type: 'unknown', message: 'No camera device found.' });
        } else if (err2.name === 'NotReadableError' || err2.name === 'TrackStartError') {
            setErrorState({ type: 'unknown', message: 'Camera is already in use by another application.' });
        } else {
            setErrorState({ type: 'unknown', message: `Camera error: ${err2.message || 'Unknown error'}` });
        }
        return;
      }
    }
    
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
         setCameraActive(true);
         videoRef.current?.play().catch(e => console.error("Play failed", e));
      };
    }
  }, []);

  useEffect(() => {
    startCamera();
    // Load active session if exists (only for Flea)
    if (mode === ScanMode.FLEA_MARKET) {
        const savedSession = localStorage.getItem('activeFleaSession');
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                setScannedBatch(parsed);
            } catch (e) {}
        }
    } else {
        setScannedBatch([]); // Reset batch when switching to binder unless specific persistence needed
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      stopContinuousScan();
    };
  }, [startCamera, mode]);

  // Persist session only for Flea Market
  useEffect(() => {
      if (mode === ScanMode.FLEA_MARKET) {
          localStorage.setItem('activeFleaSession', JSON.stringify(scannedBatch));
      }
  }, [scannedBatch, mode]);

  // --- Scanning Logic ---

  const captureAndIdentify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      await processImage(base64);
    }
  }, [mode, scannedBatch, onCardScanned, isBulkBinderMode]);

  const processImage = async (base64: string) => {
      try {
        const cardData = await geminiService.identifyCard(base64);
        const identifiedCard = cardData as Card;

        if (mode === ScanMode.FLEA_MARKET || (mode === ScanMode.ADD_TO_BINDER && isBulkBinderMode)) {
            setScannedBatch(prev => [identifiedCard, ...prev]);
            setLastScannedCard(identifiedCard);
            // Auto-hide notification
            setTimeout(() => setLastScannedCard(null), 3000);
        } else {
            onCardScanned(identifiedCard);
        }
      } catch (e) {
        console.error("Scan failed", e);
      } finally {
        setIsScanning(false);
      }
  };

  // --- Continuous Mode ---

  const toggleContinuousScan = () => {
      if (isContinuousScan) {
          stopContinuousScan();
      } else {
          setIsContinuousScan(true);
          // Scan every 4 seconds to allow for AI processing time
          continuousScanInterval.current = setInterval(() => {
              if (!isScanning && cameraActive) {
                  captureAndIdentify();
              }
          }, 4000); 
      }
  };

  const stopContinuousScan = () => {
      setIsContinuousScan(false);
      if (continuousScanInterval.current) {
          clearInterval(continuousScanInterval.current);
          continuousScanInterval.current = null;
      }
  };

  // --- Session Management ---

  const handleFinishFleaSession = () => {
      stopContinuousScan();
      // Default name
      const date = new Date();
      setSessionName(`Market Haul - ${date.toLocaleDateString()}`);
      setShowSaveModal(true);
  };

  const handleFinishBulkBinder = () => {
      stopContinuousScan();
      if (onBulkScan) {
          onBulkScan(scannedBatch);
          setScannedBatch([]);
          setIsBulkBinderMode(false);
      }
  };

  // Robust ID generation fallback
  const generateId = () => {
      try {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
              return crypto.randomUUID();
          }
      } catch(e) {}
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const saveFleaSession = () => {
      if (!onSaveSession) {
          console.error("ScannerView: onSaveSession prop is undefined.");
          return;
      }

      try {
          const session: FleaSession = {
              id: generateId(),
              name: sessionName || `Haul - ${new Date().toLocaleDateString()}`,
              date: new Date().toISOString(),
              note: sessionNote,
              cards: scannedBatch,
              totalValue: scannedBatch.reduce((acc, c) => acc + c.price, 0),
              status: 'active'
          };

          // 1. Clear local draft first to avoid sync issues
          localStorage.removeItem('activeFleaSession');
          
          // 2. Call parent handler (this usually triggers unmount/navigation)
          onSaveSession(session);
          
          // 3. Reset local state (safeguard)
          setScannedBatch([]);
          setShowSaveModal(false);
          
      } catch (e) {
          console.error("Save session failed:", e);
      }
  };

  const discardSession = () => {
      if (confirm("Discard current items? All scanned items will be lost.")) {
          localStorage.removeItem('activeFleaSession');
          setScannedBatch([]);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1];
              setIsScanning(true);
              processImage(base64);
          };
          reader.readAsDataURL(file);
      }
  };

  if (errorState) {
    return (
      <div className="h-full w-full bg-midnight rounded-3xl flex flex-col items-center justify-center p-6 text-center shadow-soft-lg border border-white/5 relative overflow-hidden">
         {/* Error UI same as before */}
         <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mb-6 border border-white/10">
          <Icons.Scan className="text-umber" size={40} />
        </div>
        <h2 className="text-xl font-bold text-light-slate mb-2">
            {errorState.type === 'permission' ? 'Camera Access Denied' : 'Scanner Offline'}
        </h2>
        <p className="text-slate-text text-sm mb-8 max-w-xs">
            {errorState.type === 'permission' 
                ? "Please enable camera permissions to scan cards." 
                : "We couldn't find a camera on this device. You can still upload photos manually."}
        </p>
        <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-navy border border-white/10 text-light-slate font-bold rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
                <Icons.FolderInput size={18} />
                Upload Photo
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden rounded-3xl shadow-soft-lg border border-white/5">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-90"
      />
      <canvas ref={canvasRef} className="hidden" />
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

      {/* Overlay UI */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 z-10 pointer-events-none">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div className={`px-4 py-2 rounded-full border shadow-lg backdrop-blur-md transition-colors
             ${mode === ScanMode.FLEA_MARKET ? 'bg-amber-500/10 border-amber-500/30' : (isBulkBinderMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-navy/60 border-white/5')}
          `}>
            <span className={`text-xs font-bold tracking-widest uppercase ${mode === ScanMode.FLEA_MARKET ? 'text-amber-400' : (isBulkBinderMode ? 'text-blue-400' : 'text-umber')}`}>
              {mode === ScanMode.FLEA_MARKET ? 'Flea Market Mode' : (isBulkBinderMode ? 'Bulk Scan Mode' : (mode === ScanMode.ADD_TO_BINDER ? 'Collection Mode' : 'Price Check'))}
            </span>
          </div>

          <div className="flex flex-col gap-2 items-end">
             <div className="flex gap-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-navy/60 backdrop-blur-md rounded-full text-light-slate border border-white/5 hover:bg-navy transition-colors"
                >
                    <Icons.FolderInput size={18} />
                </button>
                <button 
                    onClick={() => {
                        // Cycle modes
                        if (mode === ScanMode.ADD_TO_BINDER) { setMode(ScanMode.PRICE_CHECK); setIsBulkBinderMode(false); }
                        else if (mode === ScanMode.PRICE_CHECK) { setMode(ScanMode.FLEA_MARKET); setIsBulkBinderMode(false); }
                        else setMode(ScanMode.ADD_TO_BINDER);
                    }}
                    className="p-3 bg-navy/60 backdrop-blur-md rounded-full text-light-slate border border-white/5 hover:bg-navy transition-colors"
                >
                    <Icons.Repeat size={18} />
                </button>
             </div>
             
             {/* Counter */}
             {(mode === ScanMode.FLEA_MARKET || isBulkBinderMode) && (
                 <div className={`text-midnight font-bold px-3 py-1.5 rounded-xl shadow-lg text-xs flex items-center gap-2 animate-fade-in-up ${mode === ScanMode.FLEA_MARKET ? 'bg-amber-500' : 'bg-blue-500'}`}>
                     <Icons.ShoppingBag size={14} />
                     <span>{scannedBatch.length} Items</span>
                 </div>
             )}
          </div>
        </div>

        {/* Notification Toast (Flea/Bulk Mode) */}
        {lastScannedCard && (mode === ScanMode.FLEA_MARKET || isBulkBinderMode) && (
            <div className="absolute top-20 left-0 right-0 flex justify-center animate-fade-in-up pointer-events-none">
                <div className={`backdrop-blur-md text-midnight px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 max-w-[80%] ${mode === ScanMode.FLEA_MARKET ? 'bg-amber-500/90' : 'bg-blue-500/90'}`}>
                    <div className="w-8 h-10 bg-black/20 rounded overflow-hidden shrink-0">
                        <img src={lastScannedCard.imageUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold truncate">Found: {lastScannedCard.name}</p>
                        <p className="text-[10px] font-medium opacity-80">${lastScannedCard.price.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Scanner Frame */}
        <div className="relative flex-1 flex items-center justify-center pointer-events-none">
            <div className={`w-64 h-80 border rounded-3xl relative overflow-hidden transition-colors duration-500
                ${mode === ScanMode.FLEA_MARKET ? 'border-amber-500/40' : (isBulkBinderMode ? 'border-blue-500/40' : 'border-white/20')}
            `}>
                <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl-xl ${mode === ScanMode.FLEA_MARKET ? 'border-amber-500' : (isBulkBinderMode ? 'border-blue-500' : 'border-umber')}`}></div>
                <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-xl ${mode === ScanMode.FLEA_MARKET ? 'border-amber-500' : (isBulkBinderMode ? 'border-blue-500' : 'border-umber')}`}></div>
                <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-xl ${mode === ScanMode.FLEA_MARKET ? 'border-amber-500' : (isBulkBinderMode ? 'border-blue-500' : 'border-umber')}`}></div>
                <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br-xl ${mode === ScanMode.FLEA_MARKET ? 'border-amber-500' : (isBulkBinderMode ? 'border-blue-500' : 'border-umber')}`}></div>
                
                {isScanning && (
                <div className={`absolute inset-x-0 h-0.5 shadow-[0_0_20px_rgba(199,167,123,0.6)] animate-scan ${mode === ScanMode.FLEA_MARKET ? 'bg-amber-500' : (isBulkBinderMode ? 'bg-blue-500' : 'bg-umber/80')}`}></div>
                )}
            </div>
        </div>

        {/* Bottom Controls */}
        <div className="pointer-events-auto">
             
             {/* Controls Row */}
             <div className="flex items-center justify-between mb-6 px-4">
                 
                 {/* Left: Bulk Mode Toggle (Only in Binder Mode) */}
                 {mode === ScanMode.ADD_TO_BINDER && (
                     <button
                        onClick={() => {
                            setIsBulkBinderMode(!isBulkBinderMode);
                            setScannedBatch([]); // Clear batch on toggle
                            stopContinuousScan();
                        }}
                        className={`p-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors ${isBulkBinderMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-black/40 text-slate-400 border border-white/10'}`}
                     >
                         <Icons.Layers size={16} />
                         {isBulkBinderMode ? 'Bulk ON' : 'Bulk OFF'}
                     </button>
                 )}
                 {/* Left: Placeholder for Flea Mode */}
                 {mode !== ScanMode.ADD_TO_BINDER && <div className="w-10"></div>}

                 {/* Center: Previews */}
                 <div className="flex items-center gap-2">
                    {scannedBatch.slice(0,3).map((c, i) => (
                        <div key={i} className="w-8 h-11 bg-midnight border border-white/20 rounded overflow-hidden shadow-lg transform -rotate-6 hover:rotate-0 transition-transform" style={{zIndex: 10-i}}>
                            <img src={c.imageUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                    ))}
                 </div>

                 {/* Right: Finish/Discard Buttons */}
                 <div className="flex gap-2">
                     {scannedBatch.length > 0 && (
                        <button 
                             onClick={mode === ScanMode.FLEA_MARKET ? handleFinishFleaSession : handleFinishBulkBinder}
                             className={`px-4 py-2 text-midnight font-bold text-xs rounded-lg shadow-lg transition-colors ${mode === ScanMode.FLEA_MARKET ? 'bg-amber-500 hover:bg-amber-400' : 'bg-blue-500 hover:bg-blue-400'}`}
                        >
                             Finish ({scannedBatch.length})
                        </button>
                     )}
                     
                     {scannedBatch.length > 0 && (
                         <button onClick={discardSession} className="p-2 bg-black/40 rounded-full text-white/50 hover:text-white hover:bg-red-500/20 transition-colors">
                             <Icons.Trash2 size={16} />
                         </button>
                     )}
                 </div>
             </div>

             {/* Capture Button Area */}
             <div className="flex justify-center pb-24 md:pb-8 items-center gap-8">
                
                {/* Continuous Toggle (Flea or Bulk Binder) */}
                {(mode === ScanMode.FLEA_MARKET || isBulkBinderMode) && (
                    <button 
                        onClick={toggleContinuousScan}
                        className={`p-3 rounded-full border transition-all 
                            ${isContinuousScan 
                                ? (mode === ScanMode.FLEA_MARKET ? 'bg-amber-500 text-midnight border-amber-500' : 'bg-blue-500 text-midnight border-blue-500') + ' animate-pulse' 
                                : `bg-black/40 ${mode === ScanMode.FLEA_MARKET ? 'text-amber-400 border-amber-500/30' : 'text-blue-400 border-blue-500/30'}`
                            }`}
                        title="Continuous Scan"
                    >
                        {isContinuousScan ? <Icons.Pause size={20} fill="currentColor" /> : <Icons.Play size={20} fill="currentColor" />}
                    </button>
                )}

                <button 
                    onClick={captureAndIdentify}
                    disabled={isScanning || !cameraActive || isContinuousScan}
                    className={`
                    w-20 h-20 rounded-full border-[3px] flex items-center justify-center
                    transition-all duration-300 active:scale-95 shadow-2xl
                    ${isScanning 
                        ? 'bg-umber/20 border-umber animate-pulse' 
                        : mode === ScanMode.FLEA_MARKET 
                            ? 'bg-amber-900/20 border-amber-500 hover:bg-amber-500/20'
                            : isBulkBinderMode 
                                ? 'bg-blue-900/20 border-blue-500 hover:bg-blue-500/20'
                                : 'bg-white/5 border-white/30 hover:bg-white/10 hover:border-white/50'}
                    ${isContinuousScan ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <div className={`w-16 h-16 rounded-full transition-all duration-300 
                        ${isScanning 
                            ? 'bg-umber scale-90' 
                            : mode === ScanMode.FLEA_MARKET 
                                ? 'bg-amber-500 scale-100' 
                                : isBulkBinderMode 
                                    ? 'bg-blue-500 scale-100'
                                    : 'bg-light-slate scale-100'}`}
                    ></div>
                </button>
                
                {(mode === ScanMode.FLEA_MARKET || isBulkBinderMode) && <div className="w-12"></div>} {/* Spacer for symmetry */}
             </div>
        </div>

      </div>

      {/* --- SAVE SESSION MODAL --- */}
      {showSaveModal && (
          <div 
            className="absolute inset-0 z-[200] bg-midnight/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in-up"
            onClick={() => setShowSaveModal(false)}
          >
              <form 
                className="bg-navy border border-amber-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => { e.preventDefault(); saveFleaSession(); }}
              >
                  <div className="flex items-center gap-3 mb-6 text-amber-400">
                      <Icons.ShoppingBag size={24} />
                      <h2 className="text-xl font-bold">Finish The Hunt</h2>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="text-xs font-bold text-slate-text uppercase ml-1">Session Name</label>
                          <input 
                              autoFocus
                              value={sessionName}
                              onChange={(e) => setSessionName(e.target.value)}
                              className="w-full bg-midnight/50 border border-white/10 rounded-xl p-3 text-light-slate focus:border-amber-500 outline-none"
                              placeholder="e.g. Saturday Market Haul"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-text uppercase ml-1">Notes</label>
                          <textarea 
                              value={sessionNote}
                              onChange={(e) => setSessionNote(e.target.value)}
                              placeholder="Location, vendor info, etc."
                              className="w-full bg-midnight/50 border border-white/10 rounded-xl p-3 text-light-slate focus:border-amber-500 outline-none h-20 resize-none"
                          />
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button 
                          type="button"
                          onClick={() => setShowSaveModal(false)}
                          className="flex-1 py-3 rounded-xl font-bold text-slate-text bg-white/5 hover:bg-white/10 transition-colors"
                      >
                          Back
                      </button>
                      <button 
                          type="submit"
                          className="flex-1 py-3 rounded-xl font-bold text-midnight bg-amber-500 hover:bg-amber-600 shadow-lg transition-colors"
                      >
                          Save Session
                      </button>
                  </div>
              </form>
          </div>
      )}
    </div>
  );
};
