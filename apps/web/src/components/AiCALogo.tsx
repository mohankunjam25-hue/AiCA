import React from 'react';

interface AiCALogoProps {
  className?: string;
  size?: number;
}

export function AiCALogo({ className = 'w-9 h-9 sm:w-10 sm:h-10', size }: AiCALogoProps) {
  const sizeStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div
      className={`shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${className}`}
      style={sizeStyle}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        <defs>
          {/* Emerald Curved Arc */}
          <linearGradient id="aicaEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3fb950" />
            <stop offset="50%" stopColor="#2ea043" />
            <stop offset="100%" stopColor="#196c2e" />
          </linearGradient>

          {/* Ruby Accent Arc */}
          <linearGradient id="aicaRuby" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f85149" />
            <stop offset="100%" stopColor="#cf222e" />
          </linearGradient>

          {/* Radiant Gold Core Text */}
          <linearGradient id="aicaGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e3b341" />
            <stop offset="50%" stopColor="#d29922" />
            <stop offset="100%" stopColor="#b08800" />
          </linearGradient>

          {/* Clean Soft Shadow */}
          <filter id="aicaShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Left Emerald Arc (Code Orbit) */}
        <path
          d="M 32 94 C 14 76 14 44 32 26 C 44 14 66 12 84 18 C 70 24 50 32 40 46 C 30 60 30 80 32 94 Z"
          fill="url(#aicaEmerald)"
          opacity="0.95"
          filter="url(#aicaShadow)"
        />

        {/* Right Ruby Arc (Evolution Orbit) */}
        <path
          d="M 88 26 C 106 44 106 76 88 94 C 76 106 54 108 36 102 C 50 96 70 88 80 74 C 90 60 90 40 88 26 Z"
          fill="url(#aicaRuby)"
          opacity="0.9"
          filter="url(#aicaShadow)"
        />

        {/* Center Crystal-Clear Bold Text: <GV2/> */}
        <g filter="url(#aicaShadow)">
          {/* Opening Angle Bracket */}
          <text
            x="28"
            y="70"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
            fontSize="25"
            fontWeight="900"
            fill="#2ea043"
            textAnchor="middle"
          >
            &lt;
          </text>

          {/* Brand Name GV2 */}
          <text
            x="60"
            y="70"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
            fontSize="25"
            fontWeight="900"
            fill="url(#aicaGold)"
            textAnchor="middle"
            letterSpacing="-0.5px"
          >
            GV2
          </text>

          {/* Closing Slash & Angle Bracket */}
          <text
            x="92"
            y="70"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
            fontSize="25"
            fontWeight="900"
            fill="#cf222e"
            textAnchor="middle"
          >
            /&gt;
          </text>
        </g>
      </svg>
    </div>
  );
}
export default AiCALogo;
