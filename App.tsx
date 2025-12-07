import React, { useState, useEffect, useRef } from 'react';
import { DiaryEntry, AppView } from './types';
import { analyzeEntry } from './services/geminiService';
import { sfx } from './services/audioService'; 
import { Tape } from './components/Tape';
import { Recorder } from './components/Recorder';
import { PixelAvatar } from './components/PixelAvatar';
import { ContainerBackground } from './components/ContainerBackground';
import { Plus, Trash2, Rewind, Play, Pause, FastForward, ChevronLeft, Cpu, Volume2, Download, Upload } from 'lucide-react';

const STORAGE_KEY = 'retrolog_entries_v1';
const POSITIONS_KEY = 'retrolog_positions_v1';

// --- 🎵 第一步：定义音乐映射表 ---
// 这里的路径 "/1.mp3" 会自动去寻找 public 文件夹下的文件
const MOOD_PLAYLIST: Record<string, string> = {
  "😄": "/1.mp3",
  "🌧️": "/2.mp3",
  "💓": "/3.mp3",
  "💢": "/4.mp3",
  "🍃": "/5.mp3",
  "🔮": "/6.mp3",
  "BGM": "/7.mp3", // 默认背景音乐
};

// Helper for random number
const seededRandom = (seed: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296; 
};

interface Position {
  x: number;
  y: number;
  r: number;
  z: number;
}

const StatusDisplay = ({ count }: { count: number }) => {
  const mem = Math.floor(count * 1.4);
  const fullText = `TAPES: ${count}  MEM: ${mem}KB`;
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayText(''); 
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 40); 
    return () => clearInterval(timer);
  }, [fullText]);

  return (
    <div className="flex gap-4 text-xs tracking-widest text-amber-700 items-center justify-end min-w-[200px]">
       <div className="font-mono">{displayText}</div>
       <Volume2 size={14} className="opacity-50" />
    </div>
  );
};

export default function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [view, setView] = useState<AppView>(AppView.LIBRARY);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [showIntro, setShowIntro] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Layout & Dragging State
  const [tapePositions, setTapePositions] = useState<Record<string, Position>>({});
  const [dragState, setDragState] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  const [droppingId, setDroppingId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const libraryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Player specific state
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const [typedContent, setTypedContent] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'in'>('in');
  
  // --- 🎵 第二步：添加音频播放器引用 ---
  const musicPlayerRef = useRef<HTMLAudioElement | null>(null);

  const typewriterTimeoutRef = useRef<number | null>(null);
  const lastTypedIdRef = useRef<string | null>(null);

  const currentEntry = entries.find(e => e.id === currentEntryId);
  const currentIndex = currentEntry ? entries.indexOf(currentEntry) : -1;

  // Load from local storage
  useEffect(() => {
    const savedEntries = localStorage.getItem(STORAGE_KEY);
    const savedPositions = localStorage.getItem(POSITIONS_KEY);
    
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    if (savedPositions) {
      setTapePositions(JSON.parse(savedPositions));
    }
    
    // Improved Loading Sequence
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          sfx.playBoot();
          setShowIntro(false);
          return 100;
        }
        return prev + 5; 
      });
    }, 40); 

    return () => clearInterval(interval);
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(tapePositions));
  }, [tapePositions]);

  // Initialize positions
  useEffect(() => {
    const newPositions = { ...tapePositions };
    let hasChanges = false;
    let maxZ = 0;
    
    Object.values(newPositions).forEach((pos: Position) => {
      if (pos.z > maxZ) maxZ = pos.z;
    });

    const marginX = 180; 
    const marginY = 120;
    const availableW = window.innerWidth - (marginX * 2);
    const availableH = window.innerHeight - (marginY * 2);

    entries.forEach(entry => {
      if (!newPositions[entry.id]) {
        const rngX = seededRandom(entry.id + 'x');
        const rngY = seededRandom(entry.id + 'y');
        const rngRot = seededRandom(entry.id + 'r');
        
        newPositions[entry.id] = {
          x: (rngX * availableW) - (availableW / 2),
          y: (rngY * availableH) - (availableH / 2),
          r: (rngRot * 80) - 40,
          z: ++maxZ
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setTapePositions(newPositions);
    }
  }, [entries]);

  useEffect(() => {
    if (droppingId) {
      const timer = setTimeout(() => {
        setDroppingId(null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [droppingId]);

  // --- Drag Logic ---
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (view !== AppView.LIBRARY) return;
    
    isDraggingRef.current = false;
    
    let maxZ = 0;
    Object.values(tapePositions).forEach((pos: Position) => {
      if (pos.z && pos.z > maxZ) maxZ = pos.z;
    });

    setTapePositions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        z: maxZ + 1
      }
    }));
    
    const pos = tapePositions[id] || { x: 0, y: 0, r: 0, z: 0 };
    setDragState({
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;
    
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (Math.hypot(dx, dy) > 5) {
        isDraggingRef.current = true;
    }

    setTapePositions(prev => ({
      ...prev,
      [dragState.id]: {
        ...prev[dragState.id],
        x: dragState.initialX + dx,
        y: dragState.initialY + dy
      }
    }));
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  const onTapeClick = (entry: DiaryEntry) => {
      if (isDraggingRef.current) return;

      sfx.playClick();
      sfx.playInsertTape();
      setCurrentEntryId(entry.id);
      setIsPlayingMusic(true);
      setTypedContent(''); 
      setSlideDirection('in');
      setView(AppView.PLAYER);
  };

  // --- 🎵 第三步：核心播放逻辑 ---
  useEffect(() => {
    // 1. 初始化播放器
    if (!musicPlayerRef.current) {
      musicPlayerRef.current = new Audio();
      musicPlayerRef.current.loop = true;
    }
    
    const audio = musicPlayerRef.current;
    let targetSrc = "";
    let targetVolume = 0.5;

    // 2. 根据场景判断播放哪首歌曲
    if (view === AppView.PLAYER && currentEntry) {
      // 如果在播放磁带，根据 Emoji 找歌
      const moodTrack = MOOD_PLAYLIST[currentEntry.emoji];
      targetSrc = moodTrack || MOOD_PLAYLIST["BGM"]; // 找不到就播默认BGM
      targetVolume = 0.6; // 磁带音量大一点
    } else {
      // 否则（在首页或录音），播放背景音乐
      targetSrc = MOOD_PLAYLIST["BGM"];
      targetVolume = 0.2; // 首页背景音量小一点
    }

    // 3. 执行切歌和音量调整
    const handleAudioChange = async () => {
      // 检查当前是不是已经在播这首歌了
      const currentSrcPath = audio.src.replace(window.location.origin, '');

      if (currentSrcPath !== targetSrc) {
        audio.src = targetSrc;
        if (isPlayingMusic) {
          try {
            await audio.play();
          } catch (e) {
            console.log("等待用户交互后播放音频");
          }
        }
      }

      audio.volume = targetVolume;

      if (isPlayingMusic) {
        if (audio.paused && audio.src) audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    };

    handleAudioChange();

    return () => {
      // 组件卸载清理逻辑
    };
  }, [view, currentEntryId, currentEntry, isPlayingMusic]);


  // --- Typewriter ---
  useEffect(() => {
    if (view === AppView.PLAYER && currentEntry) {
      if (lastTypedIdRef.current !== currentEntry.id) {
        lastTypedIdRef.current = currentEntry.id;
        if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
        setTypedContent(''); 
        let charIndex = 0;
        const fullText = currentEntry.content;
        const startDelay = window.setTimeout(() => {
          const typeChar = () => {
            if (charIndex < fullText.length) {
              setTypedContent(fullText.slice(0, charIndex + 1));
              if (charIndex % 2 === 0) sfx.playKeyStroke(); 
              charIndex++;
              typewriterTimeoutRef.current = window.setTimeout(typeChar, 30 + Math.random() * 20); 
            }
          };
          typeChar();
        }, 500);
        typewriterTimeoutRef.current = startDelay;
      }
    } else {
      lastTypedIdRef.current = null;
      setTypedContent('');
      if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
    }
    return () => {
      if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
    };
  }, [view, currentEntryId, currentEntry]);

  const handleSaveEntry = async (title: string, content: string, color: string, emoji: string, author: string, moodId: string) => {
    sfx.playClick();
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now(),
      isAnalayzed: false,
      title: title || 'UNTITLED_TAPE',
      color,
      emoji,
      author,
      moodId 
    };
    setEntries(prev => [newEntry, ...prev]);
    sfx.playEjectTape();
    setView(AppView.LIBRARY);
    setDroppingId(newEntry.id); 
    try {
      const analysis = await analyzeEntry(content);
      setEntries(prev => prev.map(entry => 
        entry.id === newEntry.id 
          ? { ...entry, title: title || analysis.title, mood: analysis.mood, tags: analysis.tags, isAnalayzed: true } 
          : entry
      ));
      sfx.playSuccess();
    } catch (e) {
      console.error("Analysis failed", e);
      setEntries(prev => prev.map(entry => entry.id === newEntry.id ? { ...entry, isAnalayzed: true } : entry));
    }
  };

  const handleDeleteEntry = (id: string) => {
    sfx.playDelete(); 
    setEntries(prev => prev.filter(e => e.id !== id));
    setTapePositions(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
    });
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
        setIsFlipped(false); 
        setSlideDirection('in');
    }, 300);
  };

  const handleNextTape = () => {
    sfx.playClick();
    sfx.playStaticNoise(0.2);
    if (currentIndex > 0) triggerTapeSwitch('left', entries[currentIndex - 1].id);
  }

  const handlePrevTape = () => {
    sfx.playClick();
    sfx.playStaticNoise(0.2);
    if (currentIndex < entries.length - 1) triggerTapeSwitch('right', entries[currentIndex + 1].id);
  }
  
  const toggleMusic = () => {
    sfx.playClick();
    setIsPlayingMusic(!isPlayingMusic);
  }

  const handleClosePlayer = () => {
    sfx.playPowerDown();
    setDroppingId(currentEntryId); 
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

  const handleExport = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `retrolog_backup_${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    sfx.playClick();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    
    if (files && files.length > 0) {
      fileReader.readAsText(files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const importedEntries = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedEntries)) {
            setEntries(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newUnique = importedEntries.filter((ie: DiaryEntry) => !existingIds.has(ie.id));
              return [...newUnique, ...prev];
            });
            sfx.playSuccess();
          }
        } catch (error) {
          console.error("Import failed", error);
          sfx.playDelete(); 
        }
      };
    }
  };

  const handleInteraction = () => {
    sfx.resumeContext();
    // 交互时尝试启动音乐
    if (musicPlayerRef.current && isPlayingMusic) {
      musicPlayerRef.current.play().catch(() => {});
    }
  };

  if (showIntro) {
    return (
      <div 
        className="h-screen w-full flex items-center justify-center bg-black text-amber-500 font-mono flex-col gap-4 z-50 fixed top-0 left-0"
        onMouseDown={handleInteraction} 
      >
        <Cpu size={64} className="animate-pulse" />
        <div className="text-2xl tracking-[0.5em] animate-pulse">BOOTING_SYSTEM</div>
        
        <div className="w-64 h-4 border-2 border-amber-800 p-0.5 rounded">
          <div 
            className="h-full bg-amber-600 transition-all duration-75 ease-linear"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-amber-800 mt-2">
          MEM_CHECK: {Math.floor(loadingProgress)}% | TAPE_DRIVE: MOUNTED
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full bg-[#111] text-amber-500 font-mono selection:bg-amber-900 selection:text-white flex flex-col overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseDown={handleInteraction} 
    >
      <style>{`
        @keyframes slideOutLeft { to { transform: translateX(-150%) rotateY(20deg); opacity: 0; } }
        @keyframes slideOutRight { to { transform: translateX(150%) rotateY(-20deg); opacity: 0; } }
        @keyframes slideIn { from { transform: translateY(100px) scale(0.8); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes cuteWobble { 0% { transform: rotate(0deg); } 25% { transform: rotate(1deg); } 75% { transform: rotate(-1deg); } 100% { transform: rotate(0deg); } }
        @keyframes backLightPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }
        @keyframes dropIn { 0% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .slide-left { animation: slideOutLeft 0.3s forwards ease-in; }
        .slide-right { animation: slideOutRight 0.3s forwards ease-in; }
        .slide-in { animation: slideIn 0.4s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .cute-wobble { animation: cuteWobble 4s infinite ease-in-out; }
        .backlight-pulse { animation: backLightPulse 4s infinite ease-in-out; }
        .animate-drop-in { animation: dropIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
      
      <div className="scanlines"></div>
      <div 
        className="scan-bar" 
        style={{ opacity: view === AppView.LIBRARY ? 0.8 : 0.5 }}
      ></div>
      <div className="screen-glow"></div>
      
      <ContainerBackground />
      
      <header className="h-20 border-b border-amber-900/30 bg-[#0a0a0a]/80 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-40 shadow-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-600 rounded-sm flex items-center justify-center bg-amber-900/20">
             <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-amber-500/90 hidden sm:block">レトロログ <span className="text-xs align-top opacity-50">未来派日记 v1.4</span></h1>
        </div>

        <StatusDisplay count={entries.length} />

        {view === AppView.LIBRARY && (
             <button 
             onClick={() => changeView(AppView.RECORDER)}
             onMouseEnter={() => sfx.playHover()}
             className="bg-amber-700 hover:bg-amber-600 text-black font-bold px-4 py-2 flex items-center gap-2 border-b-4 border-amber-900 active:border-b-0 active:translate-y-1 transition-all"
           >
             <Plus size={16} />
             <span>新建磁带</span>
           </button>
        )}
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col z-10">
        
        {view === AppView.LIBRARY && (
          <div ref={libraryRef} className="flex-1 w-full h-full p-8 relative overflow-hidden">
            {entries.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-10">
                  <div 
                    className="animate-drop-in cursor-pointer group" 
                    onClick={() => changeView(AppView.RECORDER)}
                  >
                     <Tape
                       label="新建一个磁带"
                       date=""
                       color="bg-neutral-300"
                       emoji=""
                       author=""
                       showPlusIcon={true}
                       className="grayscale group-hover:scale-105 transition-transform duration-300"
                     />
                  </div>
               </div>
            ) : (
               <div className="absolute inset-0 w-full h-full">
                  {entries.map((entry, index) => {
                    const pos = tapePositions[entry.id] || { x: 0, y: 0, r: 0, z: index };
                    const isDragging = dragState?.id === entry.id;
                    const isDropping = droppingId === entry.id;

                    const scale = isDragging ? 1.15 : (isDropping ? 1.5 : 1.2);

                    return (
                      <div 
                        key={entry.id}
                        className="absolute top-1/2 left-1/2 transition-shadow duration-300"
                        onMouseDown={(e) => handleMouseDown(e, entry.id)}
                        style={{
                          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${pos.r}deg) scale(${scale})`,
                          zIndex: isDragging ? 99999 : (isDropping ? 9999 : pos.z),
                          cursor: isDragging ? 'grabbing' : 'grab',
                          transition: isDragging ? 'none' : (isDropping ? 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'transform 0.1s ease-out'), 
                        }}
                      >
                         <Tape 
                          label={entry.title || 'UNTITLED'}
                          date={formatDate(entry.timestamp)}
                          color={entry.color}
                          emoji={entry.emoji}
                          author={entry.author}
                          isAnalyzing={!entry.isAnalayzed}
                          className={`${isDragging ? 'shadow-2xl' : 'shadow-[0_5px_15px_rgba(0,0,0,0.5)]'}`}
                          onClick={() => onTapeClick(entry)}
                        />
                      </div>
                    );
                  })}
               </div>
            )}
          </div>
        )}

        {view === AppView.RECORDER && (
          <div 
            className="flex-1 overflow-y-auto z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => changeView(AppView.LIBRARY)}
          >
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
            className="flex-1 overflow-y-auto p-4 flex items-center justify-center cursor-zoom-out z-30 bg-black/60 backdrop-blur-sm"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="max-w-4xl w-full bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl relative animate-[fadeIn_0.5s_ease-out] cursor-auto"
            >
              <div className="bg-[#1a1a1a] p-8 border-b-4 border-neutral-800 flex justify-center perspective-[1000px] overflow-visible relative min-h-[260px] items-center">
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] opacity-40 backlight-pulse z-0 ${currentEntry.color?.replace('bg-', 'bg-')}`}></div>
                  <div className={`transform transition-all duration-300 relative z-10 ${slideDirection === 'left' ? 'slide-left' : ''} ${slideDirection === 'right' ? 'slide-right' : ''} ${slideDirection === 'in' ? 'slide-in' : ''}`}>
                      <div className="cute-wobble">
                         <Tape 
                           label={currentEntry.title || 'UNTITLED'} 
                           date={formatDate(currentEntry.timestamp)}
                           color={currentEntry.color}
                           emoji={currentEntry.emoji}
                           author={currentEntry.author}
                           isPlaying={isPlayingMusic} 
                           isAnalyzing={!currentEntry.isAnalayzed}
                           isFlipped={isFlipped}
                           onClick={handleTapeFlip}
                           className={`!shadow-[0_0_50px_rgba(0,0,0,0.5)]`}
                           style={{ boxShadow: `0 0 60px ${currentEntry.color?.includes('pink') ? 'rgba(236,72,153,0.6)' : currentEntry.color?.includes('blue') ? 'rgba(37,99,235,0.6)' : 'rgba(147,51,234,0.6)'}` }}
                         />
                      </div>
                  </div>
              </div>

              <div className="p-6 md:p-8 h-[240px] overflow-y-auto bg-black text-amber-500 font-mono text-lg leading-relaxed relative border-b border-neutral-800">
                <div className="whitespace-pre-wrap relative z-10">
                  {currentEntry.mood && (
                    <span className="float-right ml-5 mb-2 px-2 py-1 border border-amber-800 text-xs uppercase text-amber-700 select-none">
                      MOOD: {currentEntry.mood}
                    </span>
                  )}
                  {typedContent}<span className="inline-block w-2 h-5 bg-amber-500 animate-pulse ml-1 align-middle"></span>
                </div>
                <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
                    <PixelAvatar 
                      mood={currentEntry.mood} 
                      moodId={currentEntry.moodId} 
                      color={currentEntry.color} 
                      className="w-20 h-20 md:w-24 md:h-24 opacity-90" 
                    />
                </div>
                {currentEntry.tags && (
                  <div className="mt-8 pt-4 border-t border-dashed border-neutral-800 flex gap-3 flex-wrap relative z-10 clear-both">
                    {currentEntry.tags.map(tag => <span key={tag} className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded">#{tag}</span>)}
                  </div>
                )}
              </div>

              <div className="bg-neutral-800 p-4 flex justify-between items-center">
                  <button onClick={handleClosePlayer} onMouseEnter={() => sfx.playHover()} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"><ChevronLeft size={16} /> 弹出</button>
                  <div className="flex gap-4">
                    <button onClick={handlePrevTape} disabled={currentIndex >= entries.length - 1} className="p-3 bg-neutral-700 rounded shadow-md border-b-4 border-neutral-900 active:border-b-0 active:translate-y-1 hover:bg-neutral-600 disabled:opacity-30"><Rewind size={20} /></button>
                    <button onClick={toggleMusic} className={`p-3 rounded shadow-md border-b-4 translate-y-1 border-b-0 brightness-110 ${isPlayingMusic ? 'bg-amber-600 text-black border-amber-900' : 'bg-neutral-700 text-amber-500 border-neutral-900'}`}>{isPlayingMusic ? <Pause size={20} /> : <Play size={20} />}</button>
                    <button onClick={handleNextTape} disabled={currentIndex <= 0} className="p-3 bg-neutral-700 rounded shadow-md border-b-4 border-neutral-900 active:border-b-0 active:translate-y-1 hover:bg-neutral-600 disabled:opacity-30"><FastForward size={20} /></button>
                  </div>
                  <button onClick={() => handleDeleteEntry(currentEntry.id)} onMouseEnter={() => sfx.playHover()} className="text-red-900 hover:text-red-600 transition-colors p-2"><Trash2 size={20} /></button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-black/90 backdrop-blur border-t border-neutral-800 p-2 text-[10px] text-neutral-600 flex justify-between items-center font-mono uppercase shrink-0 z-10 relative">
        <div className="flex gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportFile} 
            accept=".json" 
            className="hidden" 
          />
          <button onClick={handleImportClick} className="hover:text-amber-500 flex items-center gap-1">
             <Upload size={10} /> 导入
          </button>
          <button onClick={handleExport} className="hover:text-amber-500 flex items-center gap-1">
             <Download size={10} /> 导出
          </button>
        </div>
        
        <div className="flex gap-4">
            <span>SYSTEM_STATUS: NOMINAL</span>
            <span>PWR: 98%</span>
            <span>API_LINK: {process.env.API_KEY ? 'ACTIVE' : 'OFFLINE'}</span>
        </div>
      </footer>
    </div>
  );
}