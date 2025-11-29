import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark'; // Light for white backgrounds, Dark for dark backgrounds
}

export const GloovaLogo: React.FC<LogoProps> = ({ size = 'md', theme = 'light' }) => {
  const sizeClasses = {
    sm: { box: 'w-8 h-8', text: 'text-xl', gSize: '18' },
    md: { box: 'w-10 h-10', text: 'text-2xl', gSize: '24' },
    lg: { box: 'w-16 h-16', text: 'text-4xl', gSize: '32' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${currentSize.box} bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-600/20 shadow-lg`}>
        <svg width={currentSize.gSize} height={currentSize.gSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="0" fillOpacity="0"/>
          <path d="M15 11.5V15H12.5C10.8 15 9.5 13.8 9.5 12C9.5 10.2 10.8 9 12.5 9C13.7 9 14.5 9.6 14.8 10.3" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span className={`text-white font-bold leading-none font-sans ${size === 'lg' ? 'text-3xl' : 'text-lg'}`}>G</span>
      </div>
      <span className={`${currentSize.text} font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
        Gloova<span className="text-blue-600">.ai</span>
      </span>
    </div>
  );
};
