
import React, { useState, useEffect, useRef } from 'react';
import { DiaryEntry, AppView } from './types';
import { analyzeEntry } from './services/geminiService';
import { sfx } from './services/audioService';
import { Tape } from './components/Tape';
import { Recorder } from './components/Recorder';
import { Plus, Trash2, Rewind, Play, Pause, FastForward, ChevronLeft, Cpu, Volume2 } from 'lucide-react';

const STORAGE_KEY = 'retrolog_entries_v1';

export default function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [view, setView] = useState<AppView>(AppView.LIBRARY);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [showIntro, setShowIntro] = useState(true);
  
  // Player specific state
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const [typedContent, setTypedContent] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'in'>('in');
  
  const typewriterTimeoutRef = useRef<number | null>(null);
  const lastTypedIdRef = useRef<string | null>(null);

  const currentEntry = entries.find(e => e.id === currentEntryId);
  const currentIndex = currentEntry ? entries.indexOf(currentEntry) : -1;

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setEntries(JSON.parse(saved));
    }
    
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

  // Effect 1: Audio Logic (Music Loop)
  useEffect(() => {
    let musicTimer: number | null = null;

    if (view === AppView.PLAYER && currentEntry) {
      if (isPlayingMusic) {
         // Slight delay for mechanic sound before music starts
         musicTimer = window.setTimeout(() => {
            sfx.startLofiLoop(currentEntry.color);
         }, 500);
      } else {
        sfx.stopLofiLoop();
      }
    } else {
      sfx.stopLofiLoop();
    }

    return () => {
      if (musicTimer) clearTimeout(musicTimer);
      // We stop the loop on cleanup to ensure no zombie sounds, 
      // but re-mounting will restart it if conditions are met.
      sfx.stopLofiLoop();
    };
  }, [view, currentEntryId, isPlayingMusic]); // Re-run when view, entry, or play state changes

  // Effect 2: Typewriter Logic
  useEffect(() => {
    if (view === AppView.PLAYER && currentEntry) {
      // Only restart typing if we switched to a DIFFERENT tape or just entered player view
      // This prevents restarting when 'currentEntry' updates due to async analysis (adding tags/mood)
      if (lastTypedIdRef.current !== currentEntry.id) {
        lastTypedIdRef.current = currentEntry.id;
        
        // Cleanup previous
        if (typewriterTimeoutRef.current) {
          clearTimeout(typewriterTimeoutRef.current);
        }
        setTypedContent(''); 
        
        let charIndex = 0;
        const fullText = currentEntry.content;

        // 0.5s delay before typing starts
        const startDelay = window.setTimeout(() => {
          const typeChar = () => {
            if (charIndex < fullText.length) {
              setTypedContent(fullText.slice(0, charIndex + 1));
              // Play typing sound occasionally
              if (charIndex % 2 === 0) sfx.playKeyStroke(); 
              charIndex++;
              // Randomize typing speed slightly
              typewriterTimeoutRef.current = window.setTimeout(typeChar, 30 + Math.random() * 20); 
            }
          };
          typeChar();
        }, 500);
        
        typewriterTimeoutRef.current = startDelay;
      }
    } else {
      // Reset when leaving player view
      lastTypedIdRef.current = null;
      setTypedContent('');
      if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
    }

    return () => {
      if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
    };
  }, [view, currentEntryId, currentEntry]); // Depend on currentEntry to catch content, but use ref to filter updates

  const handleSaveEntry = async (title: string, content: string, color: string, emoji: string, author: string) => {
    sfx.playClick();
    
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now(),
      isAnalayzed: false,
      title: title || 'UNTITLED_TAPE',
      color,
      emoji,
      author
    };

    setEntries(prev => [newEntry, ...prev]);
    sfx.playEjectTape();
    setView(AppView.LIBRARY);
    
    try {
      const analysis = await analyzeEntry(content);
      setEntries(prev => prev.map(entry => 
        entry.id === newEntry.id 
          ? { 
              ...entry, 
              title: title || analysis.title, 
              mood: analysis.mood, 
              tags: analysis.tags, 
              isAnalayzed: true 
            } 
          : entry
      ));
      sfx.playSuccess();
    } catch (e) {
      console.error("Analysis failed", e);
      setEntries(prev => prev.map(entry => 
        entry.id === newEntry.id 
          ? { ...entry, isAnalayzed: true } 
          : entry
      ));
    }
  };

  const handleDeleteEntry = (id: string) => {
    // Instant delete
    sfx.playDelete(); 
    setEntries(prev => prev.filter(e => e.id !== id));
    
    // Force exit to library immediately
    setView(AppView.LIBRARY);
    setCurrentEntryId(null);
  };

  const changeView = (newView: AppView) => {
    if (newView === AppView.RECORDER) sfx.playInsertTape();
    if (newView === AppView.LIBRARY && view === AppView.RECORDER) sfx.playEjectTape();
    else sfx.playClick();
    setView(newView);
  };

  const triggerTapeSwitch = (direction: 'left' | 'right', nextId: string) => {
    setSlideDirection(direction);
    setTimeout(() => {
        setCurrentEntryId(nextId);
        // setTypedContent(''); // Handled by effect
        setIsFlipped(false); // Reset flip on change
        setSlideDirection('in');
    }, 300); // Matches transition duration
  };

  const handleNextTape = () => {
    sfx.playClick();
    sfx.playStaticNoise(0.2);
    if (currentIndex > 0) {
      // Moving to newer tape (left in list)
      triggerTapeSwitch('left', entries[currentIndex - 1].id);
    }
  }

  const handlePrevTape = () => {
    sfx.playClick();
    sfx.playStaticNoise(0.2);
    if (currentIndex < entries.length - 1) {
      // Moving to older tape (right in list)
      triggerTapeSwitch('right', entries[currentIndex + 1].id);
    }
  }
  
  const toggleMusic = () => {
    sfx.playClick();
    setIsPlayingMusic(!isPlayingMusic);
  }

  const handleClosePlayer = () => {
    sfx.stopLofiLoop(); 
    sfx.playPowerDown(); // New sound
    setView(AppView.LIBRARY);
    setCurrentEntryId(null);
    setIsPlayingMusic(true); 
    setIsFlipped(false);
  }

  const handleTapeFlip = () => {
      sfx.playFlip();
      setIsFlipped(!isFlipped);
  }

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

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
    <div className="min-h-screen w-full bg-[#111] text-amber-500 font-mono selection:bg-amber-900 selection:text-white flex flex-col overflow-hidden relative">
      <style>{`
        @keyframes slideOutLeft {
          to { transform: translateX(-150%) rotateY(20deg); opacity: 0; }
        }
        @keyframes slideOutRight {
          to { transform: translateX(150%) rotateY(-20deg); opacity: 0; }
        }
        @keyframes slideIn {
          from { transform: translateY(100px) scale(0.8); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .slide-left { animation: slideOutLeft 0.3s forwards ease-in; }
        .slide-right { animation: slideOutRight 0.3s forwards ease-in; }
        .slide-in { animation: slideIn 0.4s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
      
      {/* Background Abstract Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-cyan-900/5 rounded-full blur-[80px]"></div>
      </div>

      {/* Top Bar / Deck Status */}
      <header className="border-b border-amber-900/30 bg-[#0a0a0a]/90 backdrop-blur-sm p-4 flex justify-between items-center sticky top-0 z-40 shadow-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-600 rounded-sm flex items-center justify-center bg-amber-900/20">
             <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-amber-500/90 hidden sm:block">RETROLOG <span className="text-xs align-top opacity-50">v1.4</span></h1>
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
      <main className="flex-1 overflow-hidden relative flex flex-col z-10">
        
        {view === AppView.LIBRARY && (
          <div className="flex-1 flex items-center justify-center w-full h-full p-8 overflow-hidden">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-neutral-800 rounded-lg text-neutral-600 w-full max-w-lg backdrop-blur-sm bg-black/20">
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
                <div className="flex items-center justify-center relative -space-x-48 hover:-space-x-32 transition-all duration-500 ease-out py-10 px-10">
                  {entries.map((entry, index) => (
                    <Tape 
                      key={entry.id}
                      label={entry.title || 'UNTITLED'}
                      date={formatDate(entry.timestamp)}
                      color={entry.color}
                      emoji={entry.emoji}
                      author={entry.author}
                      isAnalyzing={!entry.isAnalayzed}
                      className="hover:!scale-110 hover:!z-50 hover:-translate-y-4 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                      style={{
                        zIndex: index,
                        transform: `rotate(${(index % 3 - 1) * 2}deg)`,
                      }}
                      onClick={() => {
                        sfx.playClick();
                        sfx.playInsertTape();
                        setCurrentEntryId(entry.id);
                        setIsPlayingMusic(true);
                        setTypedContent(''); // clear previous
                        setSlideDirection('in');
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
          <div className="flex-1 overflow-y-auto z-20">
            <Recorder 
              onSave={handleSaveEntry}
              onCancel={() => changeView(AppView.LIBRARY)}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {view === AppView.PLAYER && currentEntry && (
          <div 
            onClick={handleClosePlayer}
            className="flex-1 overflow-y-auto p-4 flex items-center justify-center cursor-zoom-out z-30"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="max-w-4xl w-full bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl relative animate-[fadeIn_0.5s_ease-out] cursor-auto"
            >
              {/* Player Tape Visual */}
              <div className="bg-[#1a1a1a] p-8 border-b-4 border-neutral-800 flex justify-center perspective-[1000px] overflow-hidden">
                  <div className={`transform drop-shadow-2xl transition-all duration-300
                     ${slideDirection === 'left' ? 'slide-left' : ''} 
                     ${slideDirection === 'right' ? 'slide-right' : ''}
                     ${slideDirection === 'in' ? 'slide-in' : ''}
                  `}>
                    <Tape 
                      label={currentEntry.title || 'UNTITLED'} 
                      date={formatDate(currentEntry.timestamp)}
                      color={currentEntry.color}
                      emoji={currentEntry.emoji}
                      author={currentEntry.author}
                      isPlaying={isPlayingMusic} // Use toggle state
                      isAnalyzing={!currentEntry.isAnalayzed}
                      isFlipped={isFlipped}
                      onClick={handleTapeFlip}
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
                
                <div className="whitespace-pre-wrap">
                  {typedContent}
                  <span className="inline-block w-2 h-5 bg-amber-500 animate-pulse ml-1 align-middle"></span>
                </div>
                
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
                    onClick={handleClosePlayer}
                    onMouseEnter={() => sfx.playHover()}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
                  >
                    <ChevronLeft size={16} /> EJECT
                  </button>

                  <div className="flex gap-4">
                    <button 
                      onClick={handlePrevTape}
                      disabled={currentIndex >= entries.length - 1}
                      className="p-3 bg-neutral-700 rounded shadow-md border-b-4 border-neutral-900 active:border-b-0 active:translate-y-1 hover:bg-neutral-600 disabled:opacity-30"
                    >
                      <Rewind size={20} />
                    </button>
                    
                    <button 
                      onClick={toggleMusic}
                      className={`p-3 rounded shadow-md border-b-4 translate-y-1 border-b-0 brightness-110 ${isPlayingMusic ? 'bg-amber-600 text-black border-amber-900' : 'bg-neutral-700 text-amber-500 border-neutral-900'}`}
                    >
                      {isPlayingMusic ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    
                    <button 
                      onClick={handleNextTape} 
                      disabled={currentIndex <= 0}
                      className="p-3 bg-neutral-700 rounded shadow-md border-b-4 border-neutral-900 active:border-b-0 active:translate-y-1 hover:bg-neutral-600 disabled:opacity-30"
                    >
                      <FastForward size={20} />
                    </button>
                  </div>

                  <button 
                    onClick={() => handleDeleteEntry(currentEntry.id)}
                    onMouseEnter={() => sfx.playHover()}
                    className="text-red-900 hover:text-red-600 transition-colors p-2"
                    title="ERASE TAPE"
                  >
                    <Trash2 size={20} />
                  </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer / Status Line */}
      <footer className="bg-black border-t border-neutral-800 p-2 text-[10px] text-neutral-600 flex justify-between font-mono uppercase shrink-0 z-10 relative">
        <span>SYSTEM_STATUS: NOMINAL</span>
        <span>PWR: 98%</span>
        <span>API_LINK: {process.env.API_KEY ? 'ACTIVE' : 'OFFLINE'}</span>
      </footer>
    </div>
  );
}
