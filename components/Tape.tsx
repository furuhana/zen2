
import React, { useId, useMemo } from 'react';
import { sfx } from '../services/audioService';
import { Plus } from 'lucide-react';

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
  showPlusIcon?: boolean;
  style?: React.CSSProperties; 
  className?: string;
}

// Helper to map Tailwind bg classes to Hex colors for SVG
const getColorHex = (twClass: string) => {
  if (!twClass) return '#eab308'; // default yellow-500
  if (twClass.includes('pink')) return '#ec4899';
  if (twClass.includes('blue')) return '#3b82f6';
  if (twClass.includes('amber')) return '#f59e0b';
  if (twClass.includes('red')) return '#ef4444';
  if (twClass.includes('emerald')) return '#10b981';
  if (twClass.includes('purple')) return '#9333ea';
  // Ghost tape color handled separately in logic, but fallback here
  if (twClass.includes('neutral-300')) return '#52525b'; 
  return '#eab308';
};

export const Tape: React.FC<TapeProps> = ({ 
  label, 
  date, 
  color = "bg-amber-600", 
  emoji, 
  author = "UNKNOWN", 
  onClick, 
  isPlaying, 
  isAnalyzing, 
  isFlipped = false, 
  showPlusIcon = false, 
  style, 
  className = "" 
}) => {
  const isGhost = color.includes('neutral-300');
  const baseId = useId().replace(/:/g, '');
  const uniqueId = useMemo(() => `${baseId}-${Math.random().toString(36).substr(2, 5)}`, [baseId]);
  
  const ids = {
    bodyGrad: `bodyGrad-${uniqueId}`,
    labelGrad: `labelGrad-${uniqueId}`,
    windowGrad: `windowGrad-${uniqueId}`,
    plasticNoise: `plasticNoise-${uniqueId}`,
    clipWindow: `clipWindow-${uniqueId}`,
    gripPattern: `gripPattern-${uniqueId}`,
    highlightGrad: `highlightGrad-${uniqueId}`
  };
  
  const W = 280;
  const H = 175;

  const labelHex = isGhost ? '#9ca3af' : getColorHex(color); 
  
  // Parse date for layout (Assuming YYYY.MM.DD)
  const year = date.split('.')[0] || new Date().getFullYear().toString();
  const dayMonth = date.split('.').slice(1).join('.') || date;

  return (
    <div 
      onClick={onClick}
      style={{
        ...style,
        width: `${W}px`,
        height: `${H}px`,
        transformStyle: 'preserve-3d', 
      }}
      className={`
        relative group cursor-pointer select-none rounded-[12px]
        transition-transform duration-500 ease-out
        ${isFlipped ? '[transform:rotateY(180deg)]' : ''}
        ${className}
      `}
      onMouseEnter={() => !isPlaying && !isFlipped && sfx.playHover()}
    >
      {/* --- SIDE A (Front) --- */}
      <div 
        className="absolute inset-0 w-full h-full backface-hidden"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}>
          <defs>
            <linearGradient id={ids.bodyGrad} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>

            <linearGradient id={ids.labelGrad} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={labelHex} />
              <stop offset="100%" stopColor={labelHex} stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id={ids.windowGrad} x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" stopColor="#111" />
               <stop offset="50%" stopColor="#222" />
               <stop offset="100%" stopColor="#111" />
            </linearGradient>

            <linearGradient id={ids.highlightGrad} x1="0%" y1="100%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
               <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
            </linearGradient>

            <pattern id={ids.gripPattern} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
               <rect width="4" height="1" fill="#000" fillOpacity="0.3" />
            </pattern>

            <filter id={ids.plasticNoise}>
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                  <feFuncA type="linear" slope="0.05" />
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic" />
              <feBlend in="SourceGraphic" mode="overlay" />
            </filter>

            <clipPath id={ids.clipWindow}>
                <rect x={W*0.22} y={H*0.32} width={W*0.56} height={H*0.36} rx="2" />
            </clipPath>
          </defs>

          {/* === BODY === */}
          {/* Main shape */}
          <rect 
            x="0" y="0" width={W} height={H} rx="12"
            fill={`url(#${ids.bodyGrad})`}
            stroke="#000" strokeWidth="1"
          />
          {/* Noise Texture */}
          <rect 
            x="0" y="0" width={W} height={H} rx="12"
            fill="transparent"
            filter={`url(#${ids.plasticNoise})`}
            opacity="0.6"
          />

          {/* Bottom Grip Area */}
          <path 
             d={`M 10 ${H-40} H ${W-10} V ${H-10} Q ${W-10} ${H-5} ${W-15} ${H-5} H 15 Q 10 ${H-5} 10 ${H-10} Z`} 
             fill="#181818" 
          />
          <rect x="20" y={H-35} width={W-40} height="20" fill={`url(#${ids.gripPattern})`} opacity="0.5" />

          {/* === LABEL (Geometric Tech Style) === */}
          <path 
             d={`
               M 20 20 
               H ${W-20} 
               V ${H-55} 
               H 20 
               Z
             `}
             fill={isGhost ? "#eee" : "#fff"}
             opacity={isGhost ? 0.1 : 1}
          />
          
          {/* Color Strip */}
          <rect 
             x="20" y="35" width={W-40} height="50" 
             fill={`url(#${ids.labelGrad})`} 
          />

          {/* === WINDOW AREA === */}
          <g transform={`translate(${W*0.5}, ${H*0.45})`}>
             {/* Window Frame */}
             <rect x={-W*0.28} y={-H*0.18} width={W*0.56} height={H*0.36} rx="4" fill="#222" stroke="#444" strokeWidth="1" />
             
             {/* Glass Reflection (Subtle left side) */}
             <path d={`M ${-W*0.28} ${-H*0.18} L ${-W*0.18} ${H*0.18} H ${-W*0.28} Z`} fill="#fff" opacity="0.05" />

             {/* Clipping for Reels */}
             <g clipPath={`url(#${ids.clipWindow})`} transform={`translate(${-W*0.5}, ${-H*0.45})`}>
                 {/* Tape Background Ribbon (Grey) */}
                 <rect x={W*0.22} y={H*0.42} width={W*0.56} height={H*0.06} fill="#4a4a4a" />

                 {/* Left Tape Pack (Grey) */}
                 <circle cx={W*0.32} cy={H*0.45} r={isPlaying ? 18 : 26} fill="#4a4a4a" />
                 {/* Right Tape Pack (Grey) */}
                 <circle cx={W*0.68} cy={H*0.45} r={isPlaying ? 26 : 18} fill="#4a4a4a" />
             </g>

             {/* Highlight Diagonal (Top Layer with Gradient) */}
             <path 
               d={`M ${-W*0.1} ${H*0.18} L ${W*0.1} ${-H*0.18} L ${W*0.2} ${-H*0.18} L ${0} ${H*0.18} Z`} 
               fill={`url(#${ids.highlightGrad})`} 
             />
          </g>

          {/* === REELS (Mechanical) === */}
          {/* Left Reel */}
          <g transform={`translate(${W*0.32}, ${H*0.45})`}>
             <g className={isPlaying ? 'animate-spin-slow' : ''} style={{ animationDuration: '4s' }}>
                <circle r="12" fill="none" stroke="#ccc" strokeWidth="2" />
                <path d="M -12 0 H 12 M 0 -12 V 12" stroke="#ccc" strokeWidth="1" />
                <circle r="4" fill="#111" />
                {[0, 60, 120, 180, 240, 300].map(deg => (
                   <rect key={deg} x="-1" y="-12" width="2" height="4" fill="#fff" transform={`rotate(${deg})`} />
                ))}
             </g>
          </g>

          {/* Right Reel */}
          <g transform={`translate(${W*0.68}, ${H*0.45})`}>
             <g className={isPlaying ? 'animate-spin-slow' : ''} style={{ animationDuration: '4s' }}>
                <circle r="12" fill="none" stroke="#ccc" strokeWidth="2" />
                <path d="M -12 0 H 12 M 0 -12 V 12" stroke="#ccc" strokeWidth="1" />
                <circle r="4" fill="#111" />
                {[0, 60, 120, 180, 240, 300].map(deg => (
                   <rect key={deg} x="-1" y="-12" width="2" height="4" fill="#fff" transform={`rotate(${deg})`} />
                ))}
             </g>
          </g>

          {/* === TEXT & MARKINGS === */}

          {/* Title Area */}
          {!isGhost && (
              <text 
                x={W*0.5} 
                y={30} 
                textAnchor="middle" 
                fontFamily="monospace" 
                fontSize="10" 
                fontWeight="bold" 
                fill="#111" 
                letterSpacing="1"
                className={isAnalyzing ? 'animate-pulse' : ''}
              >
                {isAnalyzing ? 'PROCESSING...' : label.toUpperCase().substring(0, 22)}
              </text>
          )}
          {isGhost && (
              <text x={W*0.5} y={30} textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#aaa" letterSpacing="1">
                 // NEW_ENTRY //
              </text>
          )}

          {/* Side A Indicator (Left) */}
          <rect x={25} y={45} width="24" height="24" fill="#111" rx="2" />
          <text x={37} y={62} textAnchor="middle" fontFamily="Arial" fontSize="16" fontWeight="bold" fill={labelHex}>A</text>

          {/* Emoji (Right - Above Year) */}
          <text x={W-37} y={58} textAnchor="middle" fontSize="16">{emoji}</text>

          {/* Year Indicator (Right) */}
          <path d={`M ${W-50} 65 H ${W-24} L ${W-24} 80 H ${W-50} Z`} fill="none" stroke="#111" strokeWidth="1" />
          <text x={W-37} y={76} textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#111">{year}</text>

          {/* Central Date Stamp (Month.Day) */}
          <text x={W*0.5} y={105} textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#333" letterSpacing="1">
             {dayMonth}
          </text>

          {/* === SCREWS === */}
          {[
            {x: 12, y: 12}, {x: W-12, y: 12}, {x: 12, y: H-12}, {x: W-12, y: H-12}
          ].map((pos, i) => (
            <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle r="3" fill="#888" stroke="#000" strokeWidth="0.5" />
              <path d="M -2 0 H 2 M 0 -2 V 2" stroke="#333" strokeWidth="0.5" transform="rotate(45)" />
            </g>
          ))}

          {/* Plus Icon Overlay for Ghost Tape */}
          {showPlusIcon && (
             <g transform={`translate(${W-40}, 30)`}>
                <Plus size={16} color="#ef4444" strokeWidth={3} />
             </g>
          )}

        </svg>
      </div>

      {/* --- SIDE B (Back) --- */}
      <div 
        className="absolute inset-0 w-full h-full backface-hidden"
        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
            {/* Re-use Body & Texture */}
            <rect x="0" y="0" width={W} height={H} rx="12" fill={`url(#${ids.bodyGrad})`} stroke="#000" strokeWidth="1" />
            <rect x="0" y="0" width={W} height={H} rx="12" fill="transparent" filter={`url(#${ids.plasticNoise})`} opacity="0.6" />
            
            {/* Top Text: EXCLUSIVE */}
            <text 
              x={W*0.5} 
              y={H*0.5 - 12} 
              textAnchor="middle" 
              fontFamily="monospace" 
              fontSize="10" 
              fontWeight="bold" 
              fill="#666" 
              letterSpacing="2"
            >
                EXCLUSIVE
            </text>

            {/* Bottom Text: Author Name */}
            <text 
              x={W*0.5} 
              y={H*0.5 + 18} 
              textAnchor="middle" 
              fontFamily="'Brush Script MT', cursive" 
              fontSize="24" 
              fill="#999" 
              style={{ transform: 'rotate(-2deg)', transformOrigin: 'center' }}
            >
                {author || 'Unknown'}
            </text>

            {/* Screws */}
            {[ {x: 12, y: 12}, {x: W-12, y: 12}, {x: 12, y: H-12}, {x: W-12, y: H-12} ].map((pos, i) => (
                <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle r="3" fill="#888" stroke="#000" strokeWidth="0.5" />
                    <path d="M -2 0 H 2 M 0 -2 V 2" stroke="#333" strokeWidth="0.5" transform="rotate(45)" />
                </g>
            ))}
        </svg>
      </div>
    </div>
  );
};
