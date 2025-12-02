import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Mic } from 'lucide-react'; // Mic is just visual here as per instructions

interface RecorderProps {
  onSave: (content: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const Recorder: React.FC<RecorderProps> = ({ onSave, onCancel, isProcessing }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 relative">
      {/* Header / HUD */}
      <div className="flex justify-between items-end mb-4 border-b-2 border-orange-700/50 pb-2">
        <div>
          <h2 className="text-3xl text-orange-500 font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
            REC_MODE
          </h2>
          <p className="text-xs text-orange-400/70 mt-1">INPUT_STREAM: KEYBOARD_MATRIX_01</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_red]"></div>
           <span className="text-red-500 font-bold">RECORDING</span>
        </div>
      </div>

      {/* Terminal Input */}
      <div className="flex-1 bg-black border border-orange-900/50 relative overflow-hidden shadow-inner p-6">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full bg-transparent text-amber-500 font-mono text-lg md:text-xl resize-none outline-none focus:ring-0 placeholder-amber-900/50 z-20 relative leading-relaxed"
          placeholder="INITIATE THOUGHT STREAM..."
          spellCheck={false}
        />
        
        {/* Blinking Cursor Block (if empty) */}
        {!text && (
           <div className="absolute top-7 left-6 w-3 h-5 bg-amber-500 animate-pulse pointer-events-none opacity-50"></div>
        )}
      </div>

      {/* Control Deck */}
      <div className="mt-6 flex justify-between items-center bg-neutral-900 p-4 border-t-4 border-neutral-700 rounded-b-lg">
        <button 
          onClick={onCancel}
          disabled={isProcessing}
          className="group flex items-center gap-2 px-6 py-3 bg-neutral-800 border-b-4 border-neutral-950 text-neutral-400 font-bold hover:bg-neutral-700 hover:text-white active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
        >
          <X size={18} />
          <span>EJECT</span>
        </button>

        <div className="h-2 w-32 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
             {/* Fake Audio Visualizer */}
            <div className={`h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100`} style={{ width: `${Math.min(100, text.length % 100 + Math.random() * 20)}%` }}></div>
        </div>

        <button 
          onClick={() => onSave(text)}
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
              <span>SAVE_TAPE</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};