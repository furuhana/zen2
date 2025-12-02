import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-void disabled:opacity-50 disabled:cursor-not-allowed tracking-wide";
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const variants = {
    // Dreamcore Yellow: High contrast, glowing
    primary: "bg-dream-yellow text-void hover:bg-dream-glow focus:ring-dream-yellow shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] border border-transparent",
    // Outline style
    secondary: "bg-transparent text-dream-yellow border border-dream-yellow/40 hover:bg-dream-yellow/10 hover:border-dream-yellow focus:ring-dream-yellow shadow-none",
    // Danger (Red/Pinkish)
    danger: "bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 hover:text-red-300 focus:ring-red-500",
    // Ghost
    ghost: "bg-transparent text-gray-500 hover:text-dream-yellow hover:bg-dream-yellow/5 focus:ring-dream-yellow",
  };

  return (
    <button 
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} 
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;