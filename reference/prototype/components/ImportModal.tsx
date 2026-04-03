
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Icons } from './Icons';
import { Card, TCG, CardLanguage } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (cards: Card[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Partial<Card>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(s => s.replace(/^"|"$/g, '').trim());
  };

  const handleFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file.");
      return;
    }
    setError(null);
    setFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error("File is empty or missing headers");

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const map = {
          name: headers.findIndex(h => h.includes('name') || h.includes('card')),
          set: headers.findIndex(h => h.includes('set') || h.includes('expansion')),
          number: headers.findIndex(h => h.includes('number') || h.includes('code') || h.includes('#')),
          qty: headers.findIndex(h => h.includes('qty') || h.includes('quantity') || h.includes('count')),
          price: headers.findIndex(h => h.includes('price') || h.includes('value') || h.includes('market')),
          condition: headers.findIndex(h => h.includes('condition') || h.includes('grade'))
        };

        if (map.name === -1) throw new Error("Could not find a 'Name' column in CSV.");

        const parsedCards: Partial<Card>[] = lines.slice(1).map(line => {
          const cols = parseCSVLine(line);
          if (cols.length < headers.length) return null;

          return {
            name: cols[map.name] || "Unknown Card",
            set: map.set > -1 ? cols[map.set] : "Unknown Set",
            number: map.number > -1 ? cols[map.number] : "---",
            quantity: map.qty > -1 ? parseInt(cols[map.qty]) || 1 : 1,
            price: map.price > -1 ? parseFloat(cols[map.price].replace(/[^0-9.]/g, '')) || 0 : 0,
            condition: map.condition > -1 ? (cols[map.condition] as any) || 'NM' : 'NM',
          };
        }).filter(Boolean) as Partial<Card>[];

        setPreview(parsedCards);
      } catch (err: any) {
        setError(err.message || "Failed to parse CSV");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const processImport = () => {
    const newCards: Card[] = preview.map(p => ({
      id: crypto.randomUUID(),
      name: p.name || "Unknown",
      set: p.set || "Unknown Set",
      setName: p.set || "Unknown Set",
      number: p.number || "---",
      rarity: "Common", // Fix: Added missing rarity property
      imageUrl: 'https://images.unsplash.com/photo-1613771404721-c5b425876d91?q=80&w=600&auto=format&fit=crop', // Placeholder
      price: p.price || 0,
      usMarketValue: p.price || 0,
      marketTrend: 'stable',
      dateAdded: new Date().toISOString(),
      condition: (p.condition as any) || 'NM',
      quantity: p.quantity || 1,
      game: TCG.POKEMON, // Defaulting for bulk import
      language: CardLanguage.ENGLISH,
      isNew: true
    }));
    
    onImport(newCards);
    onClose();
    setFile(null);
    setPreview([]);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-midnight/80 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-navy border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0 bg-midnight/30">
          <div>
            <h2 className="text-xl font-bold text-light-slate">Bulk Import</h2>
            <p className="text-xs text-slate-text">Add cards from a spreadsheet</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-text">
            <Icons.Close size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!file ? (
            <div 
              className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                ${dragActive ? 'border-umber bg-umber/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-midnight border border-white/10 flex items-center justify-center mb-4 text-umber shadow-lg">
                <Icons.UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-bold text-light-slate mb-2">Drop CSV file here</h3>
              <p className="text-sm text-slate-text mb-6 max-w-xs">
                Or click to browse. Supported headers: Name, Set, Number, Quantity, Price, Condition.
              </p>
              <input 
                ref={inputRef} 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleChange} 
              />
              <div className="flex gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1"><Icons.FileSpreadsheet size={14} /> CSV Format</span>
                <span className="flex items-center gap-1"><Icons.Download size={14} /> Template</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-midnight/50 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Icons.FileSpreadsheet size={20} />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-light-slate">{file.name}</p>
                      <p className="text-xs text-slate-text">{(file.size / 1024).toFixed(1)} KB</p>
                   </div>
                </div>
                <button onClick={() => { setFile(null); setPreview([]); }} className="text-xs font-bold text-rose-400 hover:underline">
                   Remove
                </button>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center gap-3">
                   <Icons.Close size={16} />
                   {error}
                </div>
              )}

              {preview.length > 0 && (
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <h3 className="text-xs font-bold text-slate-text uppercase tracking-wider">Preview ({preview.length} items)</h3>
                  </div>
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-midnight text-slate-text font-bold border-b border-white/5">
                        <tr>
                          <th className="p-3">Name</th>
                          <th className="p-3">Set</th>
                          <th className="p-3">#</th>
                          <th className="p-3 text-right">Qty</th>
                          <th className="p-3 text-right">Est. Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-navy/30">
                        {preview.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            <td className="p-3 text-light-slate font-medium">{row.name}</td>
                            <td className="p-3 text-slate-400">{row.set}</td>
                            <td className="p-3 text-slate-500 font-mono">{row.number}</td>
                            <td className="p-3 text-right text-slate-300">{row.quantity}</td>
                            <td className="p-3 text-right text-umber">${row.price?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.length > 5 && (
                      <div className="p-2 text-center text-xs text-slate-500 bg-midnight/30">
                        + {preview.length - 5} more items...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-navy/95 shrink-0 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-text hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={processImport}
            disabled={!file || !!error || preview.length === 0}
            className="px-8 py-3 rounded-xl bg-umber text-midnight font-bold text-sm shadow-lg hover:bg-umber-dark hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {preview.length > 0 ? `${preview.length} Cards` : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
