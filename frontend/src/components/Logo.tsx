'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

export function Logo({ size = 'md', showText = true, textColor = 'text-gray-900' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-sm' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl' },
    xl: { icon: 'w-12 h-12', text: 'text-3xl' },
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`${sizes[size].icon} relative`}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="10" fill="url(#logoGradient)"/>
          {/* Calculator body */}
          <rect x="10" y="8" width="28" height="32" rx="3" fill="white" fillOpacity="0.15"/>
          {/* Screen */}
          <rect x="13" y="11" width="22" height="8" rx="2" fill="white" fillOpacity="0.9"/>
          {/* Dollar sign in screen */}
          <text x="24" y="17.5" textAnchor="middle" fill="#1d4ed8" fontSize="7" fontWeight="bold" fontFamily="system-ui">$</text>
          {/* Calculator buttons grid */}
          <rect x="13" y="22" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
          <rect x="21" y="22" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
          <rect x="29" y="22" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
          <rect x="13" y="28" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
          <rect x="21" y="28" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
          <rect x="29" y="28" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
          <rect x="13" y="34" width="13" height="4" rx="1" fill="white" fillOpacity="0.6"/>
          <rect x="29" y="34" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
          {/* Checkmark badge */}
          <circle cx="38" cy="38" r="9" fill="#10b981"/>
          <path d="M33.5 38l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {showText && (
        <span className={`${sizes[size].text} font-bold ${textColor}`}>
          TaxGig
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  return (
    <div className={sizes[size]}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="logoIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="10" fill="url(#logoIconGradient)"/>
        <rect x="10" y="8" width="28" height="32" rx="3" fill="white" fillOpacity="0.15"/>
        <rect x="13" y="11" width="22" height="8" rx="2" fill="white" fillOpacity="0.9"/>
        <text x="24" y="17.5" textAnchor="middle" fill="#1d4ed8" fontSize="7" fontWeight="bold" fontFamily="system-ui">$</text>
        <rect x="13" y="22" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
        <rect x="21" y="22" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
        <rect x="29" y="22" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
        <rect x="13" y="28" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
        <rect x="21" y="28" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
        <rect x="29" y="28" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
        <rect x="13" y="34" width="13" height="4" rx="1" fill="white" fillOpacity="0.6"/>
        <rect x="29" y="34" width="5" height="4" rx="1" fill="white" fillOpacity="0.6"/>
        <circle cx="38" cy="38" r="9" fill="#10b981"/>
        <path d="M33.5 38l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
