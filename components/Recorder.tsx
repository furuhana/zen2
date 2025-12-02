
import React, { useState, useEffect, useRef } from 'react';
import { Save, X } from 'lucide-react';
import { sfx } from '../services/audioService';
import { Tape } from './Tape';

interface RecorderProps {
  onSave: (title: string, content: string, color: string, emoji: string, author: string, moodId: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

// 1 高兴、2 忧郁、3 悸动、4 愤怒、5、轻松、6 神秘
const MOODS = [
  { id: 'happy', color: 'bg-pink-500', emoji: '😄', label: 'HAPPY' },
  { id: 'melancholy', color: 'bg-blue-600', emoji: '🌧️', label: 'MELANCHOLY' },
  { id: 'throbbing', color: 'bg-amber-600', emoji: '💓', label: 'THROBBING' },
  { id: 'angry', color: 'bg-red-700', emoji: '💢', label: 'ANGRY' },
  { id: 'relaxed', color: 'bg-emerald-600', emoji: '🍃', label: 'RELAXED' },
  { id: 'mysterious', color: 'bg-purple-600', emoji: '🔮', label: 'MYSTERIOUS' },
];

export const Recorder: React.FC<RecorderProps> = ({ onSave, onCancel, isProcessing }) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedMood, setSelectedMood] = useState(MOODS[2]); // Default to Throbbing/Excited
  const [headerText, setHeaderText] = useState(''); // Typewriter state
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    
    // Header Typewriter Effect
    const targetText = "REC_MODE";
    let index = 0;
    const timer = setInterval(() => {
      if (index < targetText.length) {
        setHeaderText(targetText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, []);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    sfx.playKeyStroke();
    setText(e.target.value);
  };

  const handleInputTyping = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    sfx.playKeyStroke();
    setter(e.target.value);
  }

  const handleMoodSelect = (mood: typeof MOODS[0]) => {
    sfx.playClick();
    setSelectedMood(mood);
  }

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 relative justify-center"
    >
      <style>{`
        @keyframes dropIn {
          0% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        .animate-drop-in {
          animation: dropIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {/* Header / HUD */}
      <div className="flex justify-between items-end mb-4 border-b-2 border-orange-700/50 pb-2">
        <div>
          <h2 className="text-3xl text-orange-500 font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] min-h-[36px]">
            {headerText}<span className="animate-pulse">_</span>
          </h2>
          <p className="text-xs text-orange-400/70 mt-1">入力ストリーム: KEYBOARD_MATRIX_01</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_red]"></div>
           <span className="text-red-500 font-bold">録音中</span>
        </div>
      </div>

      <div className="flex gap-4 mb-4 flex-col sm:flex-row">
        <div className="flex flex-1 gap-4">
             {/* Title Input */}
            <div className="bg-neutral-900 border border-orange-900/50 p-2 flex items-center gap-2 flex-1">
            <span className="text-orange-500 font-bold text-xs tracking-widest shrink-0">标题:</span>
            <input 
                type="text" 
                value={title}
                onChange={handleInputTyping(setTitle)}
                maxLength={20}
                className="w-full bg-transparent border-b border-dashed border-neutral-700 text-white font-mono text-lg focus:border-orange-500 outline-none uppercase tracking-widest placeholder-neutral-800"
                placeholder="UNTITLED"
            />
            </div>
            {/* Author Input */}
            <div className="bg-neutral-900 border border-orange-900/50 p-2 flex items-center gap-2 flex-1">
            <span className="text-orange-500 font-bold text-xs tracking-widest shrink-0">记录员:</span>
            <input 
                type="text" 
                value={author}
                onChange={handleInputTyping(setAuthor)}
                maxLength={10}
                className="w-full bg-transparent border-b border-dashed border-neutral-700 text-white font-mono text-lg focus:border-orange-500 outline-none uppercase tracking-widest placeholder-neutral-800"
                placeholder="OPERATOR"
            />
            </div>
        </div>

        {/* Mood Selector */}
        <div className="bg-neutral-900 border border-orange-900/50 p-2 flex items-center gap-2">
           {MOODS.map(mood => (
             <button
               key={mood.id}
               onClick={() => handleMoodSelect(mood)}
               className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all ${mood.color} ${selectedMood.id === mood.id ? 'ring-2 ring-white scale-110 z-10' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
               title={mood.label}
             >
               <span className="text-sm shadow-black drop-shadow-md">{mood.emoji}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Terminal Input */}
      <div className="flex-1 bg-black border border-orange-900/50 relative overflow-hidden shadow-inner p-6 min-h-[300px]">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTyping}
          className="w-full h-full bg-transparent text-amber-500 font-mono text-lg md:text-xl resize-none outline-none focus:ring-0 placeholder-amber-900/50 z-20 relative leading-relaxed"
          placeholder=""
          spellCheck={false}
        />
      </div>

      {/* Control Deck */}
      <div className="mt-6 flex justify-between items-center bg-neutral-900 p-4 border-t-4 border-neutral-700 rounded-b-lg">
        <button 
          onClick={onCancel}
          onMouseEnter={() => sfx.playHover()}
          disabled={isProcessing}
          className="group flex items-center gap-2 px-6 py-3 bg-neutral-800 border-b-4 border-neutral-950 text-neutral-400 font-bold hover:bg-neutral-700 hover:text-white active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
        >
          <X size={18} />
          <span>弹出</span>
        </button>

        <div className="hidden sm:block h-2 w-32 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
             {/* Fake Audio Visualizer */}
            <div className={`h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100`} style={{ width: `${Math.min(100, text.length % 100 + Math.random() * 20)}%` }}></div>
        </div>

        <button 
          onClick={() => onSave(title || 'UNTITLED', text, selectedMood.color, selectedMood.emoji, author || 'UNKNOWN', selectedMood.id)}
          onMouseEnter={() => sfx.playHover()}
          disabled={!text.trim() || isProcessing}
          className={`
            group flex items-center gap-2 px-8 py-3 
            ${isProcessing ? 'bg-amber-800 cursor-wait' : 'bg-amber-600 hover:bg-amber-500'} 
            border-b-4 border-amber-900 text-black font-bold 
            active:border-b-0 active:translate-y-1 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isProcessing ? (
             <span className="animate-pulse">PROCESSING...</span>
          ) : (
            <>
              <Save size={18} />
              <span>保存磁带</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
