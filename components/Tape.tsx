
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
  // Generate unique ID to prevent gradient collisions
  const uniqueId = useMemo(() => `${baseId}-${Math.random().toString(36).substr(2, 5)}`, [baseId]);
  
  // IDs scoped to this instance
  const ids = {
    bodyGrad: `bodyGrad-${uniqueId}`,
    labelGrad: `labelGrad-${uniqueId}`,
    reelGrad: `reelGrad-${uniqueId}`,
    windowGrad: `windowGrad-${uniqueId}`,
    plasticNoise: `plasticNoise-${uniqueId}`,
    tapeShadow: `tapeShadow-${uniqueId}`,
    clipWindow: `clipWindow-${uniqueId}`
  };
  
  // Dimensions (Standard Aspect Ratio)
  const W = 280;
  const H = 175;

  // Colors
  const labelHex = isGhost ? '#52525b' : getColorHex(color); 

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
              <stop offset="0%" stopColor="#2e2e2e" />
              <stop offset="100%" stopColor="#141414" />
            </linearGradient>

            <linearGradient id={ids.labelGrad} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={labelHex} />
              <stop offset="100%" stopColor={labelHex} stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id={ids.windowGrad} x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" stopColor="#000" />
               <stop offset="50%" stopColor="#222" />
               <stop offset="100%" stopColor="#000" />
            </linearGradient>

            {/* Noise Texture */}
            <filter id={ids.plasticNoise}>
              <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                  <feFuncA type="linear" slope="0.05" />
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic" />
              <feBlend in="SourceGraphic" mode="overlay" />
            </filter>

            <clipPath id={ids.clipWindow}>
                <rect x={W*0.28} y={H*0.35} width={W*0.44} height={H*0.3} rx="4" />
            </clipPath>
          </defs>

          {/* === BODY === */}
          {/* Main shape with notches */}
          <path 
            d={`
                M 12 0 
                H ${W-12} Q ${W} 0 ${W} 12 
                V ${H-12} Q ${W} ${H} ${W-12} ${H}
                H 12 Q 0 ${H} 0 ${H-12}
                V 12 Q 0 0 12 0
                Z
            `}
            fill={`url(#${ids.bodyGrad})`}
            stroke="#000"
            strokeWidth="1"
          />
          {/* Plastic Texture Overlay */}
          <path 
            d={`
                M 12 0 H ${W-12} Q ${W} 0 ${W} 12 V ${H-12} Q ${W} ${H} ${W-12} ${H} H 12 Q 0 ${H} 0 ${H-12} V 12 Q 0 0 12 0 Z
            `}
            fill={`url(#${ids.bodyGrad})`}
            filter={`url(#${ids.plasticNoise})`}
            opacity="0.8"
          />

          {/* Indentations/Details like the reference */}
          <path d={`M 0 30 H 15 L 25 40 V ${H-40} L 15 ${H-30} H 0`} fill="#111" opacity="0.4" />
          
          {/* === LABEL (The Colored Part) === */}
          <g transform="translate(14, 14)">
            <rect 
                width={W-28} 
                height={H-28} 
                rx="6" 
                fill={`url(#${ids.labelGrad})`} 
            />
            {/* Inner line for detail */}
            <rect 
                x="4" y="4" 
                width={W-36} 
                height={H-36} 
                rx="4" 
                fill="none" 
                stroke="#000" 
                strokeOpacity="0.1" 
                strokeWidth="1" 
            />
          </g>

          {/* === WINDOW AREA === */}
          <g transform={`translate(${W*0.25}, ${H*0.25})`}>
             {/* Black housing for reels */}
             <rect width={W*0.5} height={H*0.5} rx="8" fill="#111" />
             <rect x="2" y="2" width={W*0.5 - 4} height={H*0.5 - 4} rx="6" fill="none" stroke="#333" strokeWidth="1" />
             
             {/* Actual transparent window */}
             <rect x={W*0.03} y={H*0.1} width={W*0.44} height={H*0.3} rx="4" fill={`url(#${ids.windowGrad})`} />
             
             {/* Clipping for Tape Reels */}
             <g clipPath={`url(#${ids.clipWindow})`} transform={`translate(-${W*0.25}, -${H*0.25})`}>
                 {/* Tape Background Ribbon */}
                 <rect x={W*0.28} y={H*0.48} width={W*0.44} height={H*0.05} fill="#3e2b26" />

                 {/* Left Tape Pack */}
                 <circle cx={W*0.35} cy={H*0.5} r={isPlaying ? 16 : 24} fill="#3e2b26" />
                 {/* Right Tape Pack */}
                 <circle cx={W*0.65} cy={H*0.5} r={isPlaying ? 24 : 16} fill="#3e2b26" />
             </g>
          </g>

          {/* === REELS (White Hubs) === */}
          {/* Note: Transform origin fix - Translate the GROUP, spin the inner content at 0,0 */}
          
          {/* Left Reel */}
          <g transform={`translate(${W*0.35}, ${H*0.5})`}>
             <g className={isPlaying ? 'animate-spin-slow' : ''} style={{ animationDuration: '4s' }}>
                <circle r="14" fill="#eee" stroke="#ccc" strokeWidth="1" />
                <circle r="10" fill="none" stroke="#ddd" strokeWidth="4" strokeDasharray="2 4" />
                {/* Teeth */}
                {[0, 60, 120, 180, 240, 300].map(deg => (
                   <rect key={deg} x="-1.5" y="-14" width="3" height="4" fill="#d00" transform={`rotate(${deg})`} />
                ))}
             </g>
          </g>

          {/* Right Reel */}
          <g transform={`translate(${W*0.65}, ${H*0.5})`}>
             <g className={isPlaying ? 'animate-spin-slow' : ''} style={{ animationDuration: '4s' }}>
                <circle r="14" fill="#eee" stroke="#ccc" strokeWidth="1" />
                <circle r="10" fill="none" stroke="#ddd" strokeWidth="4" strokeDasharray="2 4" />
                {/* Teeth */}
                {[0, 60, 120, 180, 240, 300].map(deg => (
                   <rect key={deg} x="-1.5" y="-14" width="3" height="4" fill="#d00" transform={`rotate(${deg})`} />
                ))}
             </g>
          </g>

          {/* === TEXT & MARKINGS === */}

          {/* Side A */}
          <text x={30} y={45} fontFamily="Arial, sans-serif" fontSize="24" fontWeight="900" fill="#111">A</text>
          
          {/* Brand / Vertical Text */}
          <g transform={`translate(${W-35}, ${H*0.25}) rotate(90)`}>
             <text fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#111" letterSpacing="1">
                {isGhost ? 'NEW TAPE' : 'HQ RETROLOG'}
             </text>
          </g>
          <g transform={`translate(${W-22}, ${H*0.25}) rotate(90)`}>
             <text fontFamily="Arial, sans-serif" fontSize="6" fontWeight="bold" fill="#111" letterSpacing="2" opacity="0.6">
                HIGH BIAS 70μs EQ
             </text>
          </g>

          {/* Main Title (User Label) */}
          {!isGhost && (
              <text 
                x={W*0.5} 
                y={40} 
                textAnchor="middle" 
                fontFamily="monospace" 
                fontSize="12" 
                fontWeight="bold" 
                fill="#111" 
                className={isAnalyzing ? 'animate-pulse' : ''}
              >
                {isAnalyzing ? 'ANALYZING...' : label.toUpperCase().substring(0, 20)}
              </text>
          )}

          {/* Date */}
          <text x={W*0.5} y={55} textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#333">
             {date} {emoji}
          </text>

          {/* Big Number (Bottom Right) */}
          <text x={W-30} y={H-25} textAnchor="end" fontFamily="Arial, sans-serif" fontSize="48" fontWeight="900" fill="#111" letterSpacing="-2" opacity="0.9">
             {isGhost ? '--' : '90'}
          </text>
          <text x={W-30} y={H-25} textAnchor="end" fontFamily="Arial, sans-serif" fontSize="48" fontWeight="900" fill="none" stroke="#fff" strokeWidth="0.5" letterSpacing="-2" opacity="0.5">
             {isGhost ? '--' : '90'}
          </text>
          
          {/* Bottom Center Details */}
          <rect x={W*0.35} y={H-40} width={W*0.3} height={12} fill="#222" rx="2" />
          <text x={W*0.5} y={H-31} textAnchor="middle" fontSize="6" fill="#aaa" fontFamily="sans-serif">NOISE REDUCTION</text>

          {/* === SCREWS === */}
          {[
            {x: 12, y: 12}, {x: W-12, y: 12}, {x: 12, y: H-12}, {x: W-12, y: H-12}
          ].map((pos, i) => (
            <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle r="3.5" fill="#bbb" stroke="#000" strokeWidth="0.5" />
              <path d="M -2 -2 L 2 2 M -2 2 L 2 -2" stroke="#444" strokeWidth="1" />
            </g>
          ))}

          {/* Plus Icon Overlay for Ghost Tape */}
          {showPlusIcon && (
             <g transform={`translate(${W-50}, 45)`}>
                <Plus size={20} color="#dc2626" strokeWidth={4} />
             </g>
          )}

        </svg>
      </div>

      {/* --- SIDE B (Back) - Flipped View --- */}
      <div 
        className="absolute inset-0 w-full h-full backface-hidden"
        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
            {/* Same Body & Label Gradients reused */}
            
            {/* Body */}
            <path 
                d={`M 12 0 H ${W-12} Q ${W} 0 ${W} 12 V ${H-12} Q ${W} ${H} ${W-12} ${H} H 12 Q 0 ${H} 0 ${H-12} V 12 Q 0 0 12 0 Z`}
                fill={`url(#${ids.bodyGrad})`} stroke="#000" strokeWidth="1"
            />
            
            {/* Label (Back) */}
            <g transform="translate(14, 14)">
                <rect width={W-28} height={H-28} rx="6" fill={`url(#${ids.labelGrad})`} />
                {/* Writing Lines */}
                <line x1="20" y1="40" x2={W-60} y2="40" stroke="#000" strokeOpacity="0.2" strokeWidth="1" />
                <line x1="20" y1="60" x2={W-60} y2="60" stroke="#000" strokeOpacity="0.2" strokeWidth="1" />
                <line x1="20" y1="80" x2={W-60} y2="80" stroke="#000" strokeOpacity="0.2" strokeWidth="1" />
            </g>
            
            {/* Window Cutout Back */}
            <rect x={W*0.25} y={H*0.25} width={W*0.5} height={H*0.5} rx="8" fill="#111" />
            <rect x={W*0.28} y={H*0.35} width={W*0.44} height={H*0.3} rx="4" fill={`url(#${ids.windowGrad})`} />

             {/* Reels Back (Just simple circles) */}
             <circle cx={W*0.35} cy={H*0.5} r={14} fill="#eee" />
             <circle cx={W*0.65} cy={H*0.5} r={14} fill="#eee" />

            {/* B Side Indicator */}
            <text x={30} y={45} fontFamily="Arial, sans-serif" fontSize="24" fontWeight="900" fill="#111">B</text>

            {/* Author Name */}
            <text x={W*0.5} y={35} textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#111">
                OPERATOR: {author?.toUpperCase()}
            </text>

            {/* [ B ] Symbol */}
            <text x={W*0.5} y={H-25} textAnchor="middle" fontFamily="monospace" fontSize="24" fontWeight="bold" fill="#111" letterSpacing="4">
                [ B ]
            </text>

            {/* Screws */}
            {[ {x: 12, y: 12}, {x: W-12, y: 12}, {x: 12, y: H-12}, {x: W-12, y: H-12} ].map((pos, i) => (
                <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle r="3.5" fill="#bbb" stroke="#000" strokeWidth="0.5" />
                    <path d="M -2 -2 L 2 2 M -2 2 L 2 -2" stroke="#444" strokeWidth="1" />
                </g>
            ))}
        </svg>
      </div>
    </div>
  );
};
