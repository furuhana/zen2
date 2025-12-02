import React from 'react';

interface TapeProps {
  label: string;
  date: string;
  color?: string;
  onClick?: () => void;
  isPlaying?: boolean;
}

export const Tape: React.FC<TapeProps> = ({ label, date, color = "bg-amber-600", onClick, isPlaying }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative group cursor-pointer w-full max-w-sm h-48 rounded-lg 
        bg-neutral-800 border-4 border-neutral-700 shadow-lg 
        transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
        overflow-hidden flex flex-col items-center justify-center p-2
      `}
    >
      {/* Tape Body Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-30 pointer-events-none"></div>

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
        <div className="w-full h-6 bg-neutral-100 mb-1 opacity-90 px-2 flex items-center justify-between">
            <span className="text-black font-bold text-xs uppercase tracking-widest truncate">{label || 'UNTITLED'}</span>
            <span className="text-neutral-500 text-[10px] font-mono">{date}</span>
        </div>
        
        {/* Reels Window */}
        <div className="w-[70%] h-12 bg-neutral-900 rounded-full mt-2 flex items-center justify-between px-3 border-2 border-neutral-600 relative overflow-hidden">
           {/* Tape connecting reels */}
           <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-700 -translate-y-1/2 z-0"></div>
           
           {/* Left Reel */}
           <div className={`w-8 h-8 rounded-full bg-white border-4 border-neutral-300 relative z-10 ${isPlaying ? 'animate-spin-slow' : ''} flex items-center justify-center`}>
              <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
              <div className="absolute w-full h-1 bg-neutral-300 rotate-0"></div>
              <div className="absolute w-full h-1 bg-neutral-300 rotate-90"></div>
           </div>

           {/* Right Reel */}
           <div className={`w-8 h-8 rounded-full bg-white border-4 border-neutral-300 relative z-10 ${isPlaying ? 'animate-spin-slow' : ''} flex items-center justify-center`}>
              <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
              <div className="absolute w-full h-1 bg-neutral-300 rotate-0"></div>
              <div className="absolute w-full h-1 bg-neutral-300 rotate-90"></div>
           </div>
        </div>
        
        {/* A / B Side Marking */}
        <div className="absolute top-1 left-2 text-black font-bold opacity-50">A</div>
        <div className="absolute bottom-1 right-2 text-black font-bold text-[10px] opacity-70">60 MIN</div>
      </div>

      {/* Bottom Trapezoid (Head access) */}
      <div className="absolute bottom-0 w-1/2 h-8 bg-neutral-800 border-t-2 border-l-2 border-r-2 border-neutral-600 rounded-t-lg"></div>
    </div>
  );
};