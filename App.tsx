
import React, { useState, useEffect } from 'react';
import { DiaryEntry, AppView } from './types';
import { analyzeEntry } from './services/geminiService';
import { sfx } from './services/audioService';
import { Tape } from './components/Tape';
import { Recorder } from './components/Recorder';
import { Plus, Trash2, Rewind, Play, Pause, FastForward, ChevronLeft, Power, Cpu, Volume2 } from 'lucide-react';

const STORAGE_KEY = 'retrolog_entries_v1';

export default function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [view, setView] = useState<AppView>(AppView.LIBRARY);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setEntries(JSON.parse(saved));
    }
    
    // Simulate boot sequence with sound
    const timer = setTimeout(() => {
      sfx.playBoot();
      setShowIntro(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // Audio Logic for Player View
  useEffect(() => {
    if (view === AppView.PLAYER) {
      // Start Lofi Loop
      const timer = setTimeout(() => {
         sfx.startLofiLoop();
      }, 500); // Slight delay for mechanic sound
      return () => {
         clearTimeout(timer);
         sfx.stopLofiLoop();
      };
    } else {
      sfx.stopLofiLoop();
    }
  }, [view]);

  const handleSaveEntry = async (title: string, content: string) => {
    sfx.playClick();
    setIsProcessing(true);
    // Loop a processing sound occasionally
    const processingInterval = setInterval(() => sfx.playProcessing(), 500);
    
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now(),
      isAnalayzed: false,
      title: title || 'UNTITLED_TAPE',
    };

    // Optimistic update
    setEntries(prev => [newEntry, ...prev]);

    // AI Analysis
    try {
      const analysis = await analyzeEntry(content);
      
      setEntries(prev => prev.map(entry => 
        entry.id === newEntry.id 
          ? { 
              ...entry, 
              // Only overwrite title if user didn't provide one, or maybe append AI insight? 
              // Prompt said: "Magnetic tape displays title". We'll stick to user title if present, 
              // but maybe the AI suggests a "Classification". Let's stick to user title preferred.
              title: title || analysis.title, 
              mood: analysis.mood, 
              tags: analysis.tags, 
              isAnalayzed: true 
            } 
          : entry
      ));
      clearInterval(processingInterval);
      sfx.playSuccess();
    } catch (e) {
      console.error("Analysis failed", e);
      clearInterval(processingInterval);
      sfx.playError();
      setEntries(prev => prev.map(entry => 
        entry.id === newEntry.id 
          ? { ...entry, isAnalayzed: true } 
          : entry
      ));
    } finally {
      setIsProcessing(false);
      setView(AppView.LIBRARY);
    }
  };

  const handleDeleteEntry = (id: string) => {
    sfx.playClick();
    if (confirm('ERASE MAGNETIC TAPE? THIS ACTION IS IRREVERSIBLE.')) {
      sfx.playEjectTape(); 
      setEntries(prev => prev.filter(e => e.id !== id));
      if (currentEntryId === id) {
        setView(AppView.LIBRARY);
        setCurrentEntryId(null);
      }
    }
  };

  const changeView = (newView: AppView) => {
    if (newView === AppView.RECORDER) sfx.playInsertTape();
    if (newView === AppView.LIBRARY && view === AppView.RECORDER) sfx.playEjectTape();
    else sfx.playClick();
    setView(newView);
  };

  const handleFastForward = () => {
    sfx.playClick();
    sfx.playStaticNoise(0.5);
  }

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const currentEntry = entries.find(e => e.id === currentEntryId);

  // Intro Sequence
  if (showIntro) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-amber-500 font-mono flex-col gap-4">
        <Cpu size={64} className="animate-pulse" />
        <div className="text-2xl tracking-[0.5em] animate-pulse">BOOTING_SYSTEM</div>
        <div className="text-xs text-amber-800">MEM_CHECK: OK | TAPE_DRIVE: MOUNTED</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#111] text-amber-500 font-mono selection:bg-amber-900 selection:text-white flex flex-col overflow-hidden">
      
      {/* Top Bar / Deck Status */}
      <header className="border-b border-amber-900/30 bg-[#0a0a0a] p-4 flex justify-between items-center sticky top-0 z-40 shadow-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-600 rounded-sm flex items-center justify-center bg-amber-900/20">
             <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-amber-500/90 hidden sm:block">RETROLOG <span className="text-xs align-top opacity-50">v1.2</span></h1>
        </div>

        <div className="flex gap-4 text-xs tracking-widest text-amber-700 items-center">
           <div>TAPES: {entries.length}</div>
           <div className="hidden sm:block">MEM: {Math.floor(entries.length * 1.4)}KB</div>
           <Volume2 size={14} className="opacity-50" />
        </div>

        {view === AppView.LIBRARY && (
             <button 
             onClick={() => changeView(AppView.RECORDER)}
             onMouseEnter={() => sfx.playHover()}
             className="bg-amber-700 hover:bg-amber-600 text-black font-bold px-4 py-2 flex items-center gap-2 border-b-4 border-amber-900 active:border-b-0 active:translate-y-1 transition-all"
           >
             <Plus size={16} />
             <span>NEW_TAPE</span>
           </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        
        {view === AppView.LIBRARY && (
          <div className="flex-1 flex items-center justify-center w-full h-full p-8 overflow-hidden">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-neutral-800 rounded-lg text-neutral-600 w-full max-w-lg">
                 <p className="mb-4">NO DATA FOUND ON DRIVE</p>
                 <button 
                   onClick={() => changeView(AppView.RECORDER)}
                   onMouseEnter={() => sfx.playHover()}
                   className="text-amber-600 hover:text-amber-500 underline underline-offset-4"
                 >
                   INSERT NEW TAPE
                 </button>
              </div>
            ) : (
              <div className="relative h-64 flex items-center justify-center w-full perspective-[800px]">
                {/* 
                  Stacking Logic:
                  We map the entries. We shift them to the left using negative margin to overlap.
                  We add hover effects to pop them out.
                */}
                <div className="flex items-center justify-center relative -space-x-48 hover:-space-x-32 transition-all duration-500 ease-out py-10 px-10">
                  {entries.map((entry, index) => (
                    <Tape 
                      key={entry.id}
                      label={entry.title || 'PROCESSING...'}
                      date={formatDate(entry.timestamp)}
                      color={["bg-amber-600", "bg-teal-600", "bg-orange-600", "bg-purple-600"][index % 4]}
                      className="hover:!scale-110 hover:!z-50 hover:-translate-y-4 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                      style={{
                        zIndex: index,
                        transform: `rotate(${(index % 3 - 1) * 2}deg)`,
                      }}
                      onClick={() => {
                        sfx.playClick();
                        sfx.playInsertTape();
                        setCurrentEntryId(entry.id);
                        setView(AppView.PLAYER);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === AppView.RECORDER && (
          <div className="flex-1 overflow-y-auto">
            <Recorder 
              onSave={handleSaveEntry}
              onCancel={() => changeView(AppView.LIBRARY)}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {view === AppView.PLAYER && currentEntry && (
          <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
            <div className="max-w-4xl w-full bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl relative animate-[fadeIn_0.5s_ease-out]">
              {/* Player Tape Visual */}
              <div className="bg-[#1a1a1a] p-8 border-b-4 border-neutral-800 flex justify-center perspective-[1000px] overflow-hidden">
                  <div className="transform rotate-x-12 scale-110 drop-shadow-2xl">
                    <Tape 
                      label={currentEntry.title || 'UNTITLED'} 
                      date={formatDate(currentEntry.timestamp)}
                      color={["bg-amber-600", "bg-teal-600", "bg-orange-600", "bg-purple-600"][parseInt(currentEntry.id.slice(-1)) % 4]}
                      isPlaying={true}
                    />
                  </div>
              </div>

              {/* Output Screen */}
              <div className="p-6 md:p-10 min-h-[300px] bg-black text-amber-500 font-mono text-lg leading-relaxed relative border-b border-neutral-800">
                <div className="absolute top-2 right-2 flex gap-2">
                  {currentEntry.mood && (
                    <span className="px-2 py-1 border border-amber-800 text-xs uppercase text-amber-700">
                      MOOD: {currentEntry.mood}
                    </span>
                  )}
                </div>
                
                <div className="whitespace-pre-wrap">{currentEntry.content}</div>
                
                {currentEntry.tags && (
                  <div className="mt-8 pt-4 border-t border-dashed border-neutral-800 flex gap-3 flex-wrap">
                    {currentEntry.tags.map(tag => (
                      <span key={tag} className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="bg-neutral-800 p-4 flex justify-between items-center">
                  <button 
                    onClick={() => changeView(AppView.LIBRARY)}
                    onMouseEnter={() => sfx.playHover()}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
                  >
                    <ChevronLeft size={16} /> EJECT
                  </button>

                  <div className="flex gap-4">
                    <button onClick={() => sfx.playClick()} className="p-3 bg-neutral-700 rounded shadow-md border-b-4 border-neutral-900 active:border-b-0 active:translate-y-1 hover:bg-neutral-600"><Rewind size={20} /></button>
                    <button className="p-3 bg-amber-600 text-black rounded shadow-md border-b-4 border-amber-900 translate-y-1 border-b-0 brightness-110"><Play size={20} /></button>
                    <button onClick={handleFastForward} className="p-3 bg-neutral-700 rounded shadow-md border-b-4 border-neutral-900 active:border-b-0 active:translate-y-1 hover:bg-neutral-600"><FastForward size={20} /></button>
                  </div>

                  <button 
                    onClick={() => handleDeleteEntry(currentEntry.id)}
                    onMouseEnter={() => sfx.playHover()}
                    className="text-red-900 hover:text-red-600 transition-colors p-2"
                  >
                    <Trash2 size={20} />
                  </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer / Status Line */}
      <footer className="bg-black border-t border-neutral-800 p-2 text-[10px] text-neutral-600 flex justify-between font-mono uppercase shrink-0">
        <span>SYSTEM_STATUS: NOMINAL</span>
        <span>PWR: 98%</span>
        <span>API_LINK: {process.env.API_KEY ? 'ACTIVE' : 'OFFLINE'}</span>
      </footer>
    </div>
  );
}
