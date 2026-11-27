import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'purple' | 'emerald' | 'blue' | 'white';
  className?: string;
  label?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

const variantClasses = {
  default: 'text-slate-500 dark:text-slate-400',
  purple: 'text-[#8250df] dark:text-[#a371f7]',
  emerald: 'text-[#1a7f37] dark:text-[#3fb950]',
  blue: 'text-[#0969da] dark:text-[#58a6ff]',
  white: 'text-white'
};

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className = '',
  label
}: LoadingSpinnerProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} ${variantClasses[variant]} animate-spin shrink-0`} />
      {label && <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>}
    </div>
  );
}
