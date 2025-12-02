
import React, { useState, useEffect } from 'react';

interface PixelAvatarProps {
  mood?: string;   // Optional AI mood string (fallback)
  moodId?: string; // Explicit mood ID (primary)
  color?: string;  // Color class (fallback)
  className?: string;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({ mood = '', moodId = '', color = '', className = '' }) => {
  const [frame, setFrame] = useState(0);

  // Toggle frame every 800ms for that retro RPG idle animation feel
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => (prev === 0 ? 1 : 0));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Determine avatar key based on priority: moodId > color > mood string
  const getAvatarKey = () => {
    if (moodId) return moodId;
    
    // Fallback to color
    if (color.includes('pink')) return 'happy';
    if (color.includes('blue')) return 'melancholy';
    if (color.includes('amber')) return 'throbbing';
    if (color.includes('red')) return 'angry';
    if (color.includes('emerald')) return 'relaxed';
    if (color.includes('purple')) return 'mysterious';

    // Fallback to mood text matching
    const m = mood.toLowerCase();
    if (m.includes('happy')) return 'happy';
    if (m.includes('sad') || m.includes('melancholy')) return 'melancholy';
    if (m.includes('excit') || m.includes('throb')) return 'throbbing';
    if (m.includes('angr')) return 'angry';
    if (m.includes('relax')) return 'relaxed';
    if (m.includes('myster')) return 'mysterious';

    return 'happy'; // Default
  };

  const avatarKey = getAvatarKey();

  const renderAvatar = () => {
    const svgProps = {
      viewBox: "0 0 24 24",
      className: `w-full h-full drop-shadow-md`,
      shapeRendering: "crispEdges"
    };

    const Pixel = ({ x, y, color, w=1, h=1, opacity=1 }: { x: number, y: number, color: string, w?: number, h?: number, opacity?: number }) => (
      <rect x={x} y={y} width={w} height={h} fill={color} fillOpacity={opacity} />
    );

    if (avatarKey === 'happy') {
       return (
         <svg {...svgProps}>
            <Pixel x={6} y={6} w={12} h={10} color="#ec4899" /> 
            <Pixel x={7} y={9} w={10} h={8} color="#ffe4c4" />
            <Pixel x={6} y={6} w={12} h={3} color="#db2777" />
            <Pixel x={6} y={9} w={2} h={4} color="#db2777" />
            <Pixel x={16} y={9} w={2} h={4} color="#db2777" />
            <Pixel x={6} y={4} w={2} h={2} color="#ec4899" />
            <Pixel x={16} y={4} w={2} h={2} color="#ec4899" />
            
            {frame === 0 && (
               <>
                 <Pixel x={9} y={12} w={1} h={2} color="#000" /> 
                 <Pixel x={14} y={12} w={1} h={2} color="#000" /> 
                 <Pixel x={10} y={15} w={4} h={1} color="#000" /> 
                 <Pixel x={10} y={15} w={1} h={-1} color="#000" /> 
                 <Pixel x={13} y={15} w={1} h={-1} color="#000" />
               </>
            )}
            {frame === 1 && (
               <>
                 <Pixel x={9} y={13} w={2} h={1} color="#000" /> 
                 <Pixel x={14} y={12} w={1} h={2} color="#000" /> 
                 <Pixel x={10} y={15} w={4} h={2} color="#9d174d" /> 
               </>
            )}
            <Pixel x={8} y={13} w={1} h={1} color="#fca5a5" />
            <Pixel x={15} y={13} w={1} h={1} color="#fca5a5" />
         </svg>
       );
    } 
    else if (avatarKey === 'melancholy') {
        return (
          <svg {...svgProps}>
             <Pixel x={6} y={5} w={12} h={14} color="#2563eb" />
             <Pixel x={8} y={8} w={8} h={8} color="#000000" opacity={0.3} />
             <Pixel x={9} y={9} w={6} h={6} color="#ffe4c4" />
             <Pixel x={9} y={9} w={3} h={4} color="#1e40af" />

             {frame === 0 && (
                <>
                  <Pixel x={13} y={12} w={1} h={1} color="#000" /> 
                  <Pixel x={11} y={14} w={2} h={1} color="#000" /> 
                </>
             )}
             {frame === 1 && (
                <>
                  <Pixel x={13} y={12} w={2} h={1} color="#000" /> 
                  <Pixel x={11} y={14} w={2} h={1} color="#000" /> 
                  <Pixel x={13} y={14} w={1} h={2} color="#93c5fd" /> 
                </>
             )}
          </svg>
        );
    }
    else if (avatarKey === 'throbbing') {
        return (
          <svg {...svgProps}>
             <Pixel x={6} y={6} w={12} h={11} color="#d97706" />
             <Pixel x={5} y={8} w={1} h={8} color="#d97706" /> 
             <Pixel x={7} y={8} w={10} h={8} color="#ffe4c4" />
             <Pixel x={16} y={4} w={3} h={4} color="#d97706" />

             {frame === 0 && (
                <>
                  <Pixel x={8} y={11} w={2} h={2} color="#000" /> 
                  <Pixel x={14} y={11} w={2} h={2} color="#000" /> 
                  <Pixel x={11} y={14} w={2} h={1} color="#000" /> 
                </>
             )}
             {frame === 1 && (
                <>
                  <Pixel x={8} y={11} w={2} h={2} color="#ef4444" /> 
                  <Pixel x={14} y={11} w={2} h={2} color="#ef4444" /> 
                  <Pixel x={11} y={13} w={2} h={2} color="#000" /> 
                  <Pixel x={3} y={5} w={2} h={2} color="#ef4444" /> 
                </>
             )}
          </svg>
        );
    }
    else if (avatarKey === 'angry') {
        return (
          <svg {...svgProps}>
             <Pixel x={6} y={5} w={12} h={12} color="#b91c1c" />
             <Pixel x={5} y={4} w={2} h={2} color="#b91c1c" />
             <Pixel x={10} y={3} w={2} h={3} color="#b91c1c" />
             <Pixel x={17} y={4} w={2} h={2} color="#b91c1c" />
             <Pixel x={7} y={8} w={10} h={8} color="#ffe4c4" />

             {frame === 0 && (
                <>
                  <Pixel x={8} y={10} w={1} h={1} color="#000" /> 
                  <Pixel x={15} y={10} w={1} h={1} color="#000" /> 
                  <Pixel x={8} y={9} w={2} h={1} color="#000" /> 
                  <Pixel x={14} y={9} w={2} h={1} color="#000" /> 
                  <Pixel x={10} y={14} w={4} h={1} color="#000" /> 
                  <Pixel x={16} y={7} w={2} h={2} color="#ef4444" />
                </>
             )}
             {frame === 1 && (
                <>
                  <Pixel x={8} y={10} w={1} h={1} color="#000" /> 
                  <Pixel x={15} y={10} w={1} h={1} color="#000" />
                  <Pixel x={8} y={9} w={2} h={1} color="#000" />
                  <Pixel x={14} y={9} w={2} h={1} color="#000" />
                  <Pixel x={10} y={13} w={4} h={3} color="#000" /> 
                  <Pixel x={11} y={14} w={2} h={1} color="#fff" /> 
                </>
             )}
          </svg>
        );
    }
    else if (avatarKey === 'relaxed') {
        return (
          <svg {...svgProps}>
             <Pixel x={6} y={6} w={12} h={10} color="#059669" />
             <Pixel x={7} y={9} w={10} h={8} color="#ffe4c4" />

             {frame === 0 && (
                <>
                  <Pixel x={8} y={12} w={3} h={1} color="#000" /> 
                  <Pixel x={13} y={12} w={3} h={1} color="#000" /> 
                  <Pixel x={11} y={15} w={2} h={1} color="#000" /> 
                  <Pixel x={17} y={7} w={1} h={1} color="#fff" opacity={0.5} /> 
                </>
             )}
             {frame === 1 && (
                <>
                  <Pixel x={8} y={12} w={3} h={1} color="#000" /> 
                  <Pixel x={13} y={12} w={3} h={1} color="#000" /> 
                  <Pixel x={11} y={15} w={1} h={1} color="#000" /> 
                  <Pixel x={12} y={14} w={2} h={2} color="#a7f3d0" /> 
                  <Pixel x={18} y={6} w={2} h={2} color="#fff" opacity={0.8} /> 
                </>
             )}
          </svg>
        );
    }
    else if (avatarKey === 'mysterious') {
        return (
          <svg {...svgProps}>
             <Pixel x={5} y={4} w={14} h={16} color="#4c1d95" />
             <Pixel x={7} y={7} w={10} h={10} color="#1e1b4b" />
             
             {frame === 0 && (
                <>
                   <Pixel x={9} y={11} w={2} h={1} color="#a855f7" opacity={0.5} />
                   <Pixel x={13} y={11} w={2} h={1} color="#a855f7" opacity={0.5} />
                </>
             )}
             {frame === 1 && (
                <>
                   <Pixel x={9} y={11} w={2} h={1} color="#d8b4fe" />
                   <Pixel x={13} y={11} w={2} h={1} color="#d8b4fe" />
                   <Pixel x={5} y={15} w={1} h={1} color="#d8b4fe" />
                   <Pixel x={18} y={6} w={1} h={1} color="#d8b4fe" />
                </>
             )}
          </svg>
        );
    }

    return <svg {...svgProps}><rect width={24} height={24} fill="#ccc" /></svg>;
  };

  return (
    <div className={`w-24 h-24 image-pixelated float-anim ${className}`}>
        <style>{`
          .image-pixelated { image-rendering: pixelated; }
          @keyframes floatAnim {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .float-anim { animation: floatAnim 3s ease-in-out infinite; }
        `}</style>
        {renderAvatar()}
    </div>
  );
};
