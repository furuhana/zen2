
import React from 'react';

interface PixelAvatarProps {
  mood?: string;   // Optional AI mood string (fallback)
  moodId?: string; // Explicit mood ID (primary)
  color?: string;  // Color class (fallback)
  className?: string;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({ mood = '', moodId = '', color = '', className = '' }) => {
  
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

  // Map keys to GIF files
  const gifMap: Record<string, string> = {
    'happy': '/c1.gif',
    'melancholy': '/c2.gif',
    'throbbing': '/c3.gif',
    'angry': '/c4.gif',
    'relaxed': '/c5.gif',
    'mysterious': '/c6.gif'
  };

  const src = gifMap[avatarKey] || '/c1.gif';

  return (
    <div className={`relative ${className}`}>
        <img 
          src={src} 
          alt={avatarKey} 
          className="w-full h-full object-contain drop-shadow-md image-pixelated" 
        />
        <style>{`
          .image-pixelated { image-rendering: pixelated; }
        `}</style>
    </div>
  );
};
