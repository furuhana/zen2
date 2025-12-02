
import React from 'react';
import { sfx } from '../services/audioService';

interface TapeProps {
  label: string;
  date: string;
  color?: string;
  emoji?: string;
  author?: string;
  onClick?: () => void;
  isPlaying?: boolean;
  isAnalyzing?: boolean;
  isFlipped?: boolean;
  style?: React.CSSProperties; // Allow passing z-index and transform
  className?: string;
}

export const Tape: React.FC<TapeProps> = ({ label, date, color = "bg-amber-600", emoji, author = "UNKNOWN", onClick, isPlaying, isAnalyzing, isFlipped = false, style, className = "" }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        ...style,
        transformStyle: 'preserve-3d', // Enable 3D transform for children
      }}
      onMouseEnter={() => !isPlaying && !isFlipped && sfx.playHover()}
      className={`
        relative group cursor-pointer w-[340px] h-52 
        transition-all duration-500 ease-out
        ${isFlipped ? 'rotate-y-180' : ''}
        ${className}
      `}
    >
      <style>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>

      {/* --- FRONT SIDE --- */}
      <div className="absolute inset-0 backface-hidden w-full h-full rounded-lg bg-neutral-800 border-4 border-neutral-700 shadow-2xl flex flex-col items-center justify-center p-2">
          {/* Tape Body Texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-30 pointer-events-none rounded-lg"></div>

          {/* Screw holes */}
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-neutral-900 border border-neutral-600">
            <div className="w-full h-[1px] bg-neutral-700 absolute top-1/2 -translate-y-1/2 rotate-45"></div>
          </div>
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-neutral-900 border border-neutral-600">
            <div className="w-full h-[1px] bg-neutral-700 absolute top-1/2 -translate-y-1/2 rotate-45"></div>
          </div>
          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-neutral-900 border border-neutral-600">
            <div className="w-full h-[1px] bg-neutral-700 absolute top-1/2 -translate-y-1/2 rotate-45"></div>
          </div>
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-neutral-900 border border-neutral-600">
            <div className="w-full h-[1px] bg-neutral-700 absolute top-1/2 -translate-y-1/2 rotate-45"></div>
          </div>

          {/* Label Area */}
          <div className={`w-[90%] h-[60%] ${color} rounded-sm relative shadow-inner p-2 flex flex-col items-center z-10`}>
            <div className="w-full h-8 bg-neutral-100 mb-1 opacity-90 px-2 flex items-center justify-between shadow-sm">
                <span className={`text-black font-bold font-mono text-sm uppercase tracking-widest truncate w-32 ${isAnalyzing ? 'animate-pulse' : ''}`}>
                  {isAnalyzing ? 'ANALYZING...' : (label || 'UNTITLED')}
                </span>
                <div className="flex items-center gap-1">
                  {emoji && <span className="text-sm">{emoji}</span>}
                  <span className="text-neutral-500 text-[10px] font-mono">{date}</span>
                </div>
            </div>
            
            {/* Reels Window */}
            <div className="w-[70%] h-12 bg-neutral-900 rounded-full mt-2 flex items-center justify-between px-3 border-2 border-neutral-600 relative overflow-hidden shadow-inner">
              {/* Tape connecting reels */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-700 -translate-y-1/2 z-0"></div>
              
              {/* Left Reel */}
              <div className={`w-8 h-8 rounded-full bg-white border-4 border-neutral-300 relative z-10 ${isPlaying || isAnalyzing ? 'animate-spin-slow' : ''} flex items-center justify-center shadow-md`}>
                  <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
                  <div className="absolute w-full h-1 bg-neutral-300 rotate-0"></div>
                  <div className="absolute w-full h-1 bg-neutral-300 rotate-90"></div>
              </div>

              {/* Right Reel */}
              <div className={`w-8 h-8 rounded-full bg-white border-4 border-neutral-300 relative z-10 ${isPlaying || isAnalyzing ? 'animate-spin-slow' : ''} flex items-center justify-center shadow-md`}>
                  <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
                  <div className="absolute w-full h-1 bg-neutral-300 rotate-0"></div>
                  <div className="absolute w-full h-1 bg-neutral-300 rotate-90"></div>
              </div>
            </div>
            
          </div>

          {/* A Side Marking - Moved to Bottom Left and Larger */}
          <div className="absolute bottom-3 left-4 text-neutral-300 font-bold text-3xl opacity-50 font-mono">Ａ面</div>
          <div className="absolute bottom-3 right-4 text-neutral-400 font-bold text-[10px] opacity-70">C-60</div>

          {/* Bottom Trapezoid (Head access) */}
          <div className="absolute bottom-0 w-1/2 h-8 bg-neutral-800 border-t-2 border-l-2 border-r-2 border-neutral-600 rounded-t-lg shadow-sm z-20"></div>
      </div>

      {/* --- BACK SIDE (B Side) --- */}
      <div 
        className="absolute inset-0 backface-hidden w-full h-full rounded-lg bg-neutral-800 border-4 border-neutral-700 shadow-2xl flex flex-col items-center justify-center p-2"
        style={{ transform: 'rotateY(180deg)' }}
      >
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-30 pointer-events-none rounded-lg"></div>
           
           {/* Screw holes */}
           <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-neutral-900 border border-neutral-600"></div>
           <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-neutral-900 border border-neutral-600"></div>
           <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-neutral-900 border border-neutral-600"></div>
           <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-neutral-900 border border-neutral-600"></div>

           {/* Label Area Back */}
           <div className={`w-[90%] h-[60%] ${color} rounded-sm relative shadow-inner p-2 flex flex-col items-center z-10 justify-center opacity-80`}>
             <div className="w-full border-b border-black/20 mb-2"></div>
             <div className="w-full border-b border-black/20 mb-2"></div>
             <div className="text-black font-mono font-bold text-xl uppercase tracking-widest">{author}</div>
             <div className="text-[10px] text-black/60 font-mono tracking-widest mt-1">OPERATOR LOG</div>
             <div className="w-full border-b border-black/20 mt-2"></div>
             <div className="w-full border-b border-black/20 mt-2"></div>
           </div>
           
           {/* B Side Marking */}
           <div className="absolute bottom-3 left-4 text-neutral-300 font-bold text-3xl opacity-50 font-mono">Ｂ面</div>
           
           {/* Bottom Trapezoid (Head access) */}
           <div className="absolute bottom-0 w-1/2 h-8 bg-neutral-800 border-t-2 border-l-2 border-r-2 border-neutral-600 rounded-t-lg shadow-sm z-20"></div>
      </div>

    </div>
  );
};
