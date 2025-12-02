
import React from 'react';

export const DeskBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#0a0a0a]">
      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)] z-20 opacity-80 pointer-events-none"></div>
      
      {/* Pixel Art SVG */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 320 180" 
        preserveAspectRatio="xMidYMid slice" 
        shapeRendering="crispEdges"
        className="opacity-40"
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a1a" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Desk Mat / Surface Texture */}
        <rect x="0" y="0" width="320" height="180" fill="#151515" />
        <rect x="0" y="0" width="320" height="180" fill="url(#grid)" opacity="0.5" />

        {/* --- ITEM: BLUEPRINT (Top Left) --- */}
        <g transform="translate(20, 10) rotate(5)">
           <rect x="0" y="0" width="60" height="45" fill="#1e3a8a" /> {/* Blueprint Paper */}
           <rect x="2" y="2" width="56" height="41" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
           {/* Grid lines */}
           <path d="M 0 10 H 60 M 0 20 H 60 M 0 30 H 60 M 0 40 H 60" stroke="#fff" strokeWidth="0.2" opacity="0.2" />
           <path d="M 10 0 V 45 M 20 0 V 45 M 30 0 V 45 M 40 0 V 45 M 50 0 V 45" stroke="#fff" strokeWidth="0.2" opacity="0.2" />
           {/* Schematic drawing (Mech arm) */}
           <path d="M 10 35 L 20 20 L 30 20 L 35 10" fill="none" stroke="#fff" strokeWidth="1" />
           <circle cx="20" cy="20" r="2" stroke="#fff" strokeWidth="0.5" fill="none" />
           <circle cx="30" cy="20" r="2" stroke="#fff" strokeWidth="0.5" fill="none" />
        </g>

        {/* --- ITEM: ROLLED MAP (Top Right) --- */}
        <g transform="translate(240, 20) rotate(-10)">
           {/* Main scroll body */}
           <rect x="0" y="0" width="50" height="40" fill="#d4b483" />
           {/* Map details */}
           <path d="M 10 10 Q 25 5 40 10 T 50 30" fill="none" stroke="#8b4513" strokeWidth="0.5" strokeDasharray="2,1" />
           <path d="M 5 30 Q 20 35 35 25" fill="none" stroke="#8b4513" strokeWidth="0.5" />
           <circle cx="15" cy="15" r="1" fill="#ef4444" /> {/* Red marker */}
           <circle cx="35" cy="25" r="1" fill="#ef4444" /> {/* Red marker */}
           {/* Rolled edges */}
           <rect x="-2" y="-2" width="54" height="4" fill="#c2a273" />
           <rect x="-2" y="38" width="54" height="4" fill="#c2a273" />
        </g>

        {/* --- ITEM: SCREWDRIVER & TOOLS (Bottom Left) --- */}
        <g transform="translate(30, 130) rotate(45)">
           <rect x="0" y="0" width="4" height="20" fill="#9ca3af" /> {/* Shaft */}
           <rect x="-2" y="20" width="8" height="15" fill="#dc2626" rx="1" /> {/* Handle */}
           <rect x="-2" y="22" width="8" height="2" fill="#b91c1c" /> {/* Grip line */}
           <rect x="-2" y="26" width="8" height="2" fill="#b91c1c" /> {/* Grip line */}
           <rect x="-2" y="30" width="8" height="2" fill="#b91c1c" /> {/* Grip line */}
        </g>
        <g transform="translate(50, 140) rotate(-30)">
            {/* Wrench */}
           <rect x="0" y="0" width="6" height="30" fill="#6b7280" rx="1" />
           <circle cx="3" cy="2" r="4" fill="#6b7280" />
           <circle cx="3" cy="2" r="2" fill="#151515" />
        </g>

        {/* --- ITEM: RETRO GAME CONSOLE (Bottom Right) --- */}
        <g transform="translate(260, 120) rotate(-15)">
           <rect x="0" y="0" width="30" height="50" fill="#94a3b8" rx="2" /> {/* Body */}
           <rect x="3" y="5" width="24" height="20" fill="#334155" /> {/* Screen bezel */}
           <rect x="5" y="7" width="20" height="16" fill="#86efac" opacity="0.8" /> {/* Screen */}
           <rect x="5" y="30" width="8" height="8" fill="#1e293b" rx="1" /> {/* D-Pad */}
           <circle cx="20" cy="32" r="2" fill="#be123c" /> {/* Button A */}
           <circle cx="24" cy="36" r="2" fill="#be123c" /> {/* Button B */}
           <rect x="8" y="42" width="4" height="2" fill="#334155" transform="rotate(20)" /> {/* Select */}
           <rect x="16" y="42" width="4" height="2" fill="#334155" transform="rotate(20)" /> {/* Start */}
        </g>

        {/* --- ITEM: COFFEE MUG (Mid Left) --- */}
        <g transform="translate(80, 80)">
           <circle cx="10" cy="10" r="10" fill="#1f2937" /> {/* Shadow/Saucer */}
           <rect x="2" y="2" width="16" height="18" fill="#fff" rx="1" /> {/* Mug body */}
           <rect x="18" y="6" width="4" height="8" fill="none" stroke="#fff" strokeWidth="2" /> {/* Handle */}
           <rect x="4" y="4" width="12" height="14" fill="#3b2f2f" /> {/* Coffee liquid (top down view ish) */}
           {/* Steam */}
           <path d="M 6 0 Q 8 -5 6 -10" stroke="#fff" strokeWidth="1" opacity="0.5" fill="none">
             <animate attributeName="d" values="M 6 0 Q 8 -5 6 -10; M 6 -2 Q 4 -7 6 -12; M 6 0 Q 8 -5 6 -10" dur="3s" repeatCount="indefinite" />
             <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
           </path>
           <path d="M 12 0 Q 14 -5 12 -10" stroke="#fff" strokeWidth="1" opacity="0.5" fill="none">
             <animate attributeName="d" values="M 12 0 Q 14 -5 12 -10; M 12 -2 Q 10 -7 12 -12; M 12 0 Q 14 -5 12 -10" dur="3s" repeatCount="indefinite" begin="1.5s" />
             <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" begin="1.5s" />
           </path>
        </g>

        {/* --- ITEM: STICKY NOTES --- */}
        <g transform="translate(180, 40) rotate(5)">
           <rect x="0" y="0" width="20" height="20" fill="#fef08a" />
           <rect x="2" y="2" width="16" height="2" fill="#facc15" opacity="0.5" /> {/* Tape/Glue */}
           <path d="M 4 8 H 16 M 4 12 H 14 M 4 16 H 10" stroke="#000" strokeWidth="0.5" opacity="0.3" />
        </g>
        <g transform="translate(160, 140) rotate(-5)">
            <rect x="0" y="0" width="20" height="20" fill="#f472b6" />
            <path d="M 5 10 L 15 10" stroke="#000" strokeWidth="1" />
            <path d="M 8 5 L 12 5 L 12 15 L 8 15" fill="none" stroke="#000" strokeWidth="0.5" />
        </g>

        {/* --- ITEM: CRUMPLED PAPER --- */}
        <g transform="translate(280, 80)">
           <path d="M 0 5 L 5 0 L 15 2 L 20 10 L 15 18 L 5 15 L 0 5" fill="#f3f4f6" />
           <path d="M 5 0 L 10 10 L 15 2 M 0 5 L 10 10 L 5 15" stroke="#d1d5db" strokeWidth="0.5" fill="none" />
        </g>

        {/* --- ITEM: FLOPPY DISKS --- */}
        <g transform="translate(120, 150) rotate(10)">
           <rect x="0" y="0" width="25" height="25" fill="#374151" rx="1" />
           <rect x="5" y="0" width="15" height="10" fill="#9ca3af" /> {/* Shutter */}
           <rect x="5" y="15" width="15" height="8" fill="#fff" /> {/* Label */}
        </g>
        <g transform="translate(130, 155) rotate(25)">
           <rect x="0" y="0" width="25" height="25" fill="#4b5563" rx="1" />
           <rect x="5" y="0" width="15" height="10" fill="#9ca3af" /> 
        </g>

      </svg>
    </div>
  );
};
