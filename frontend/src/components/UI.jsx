import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Card Component ---
// Uses parchment background with ink text and a subtle wood border
export const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      "bg-parchment text-ink border-2 border-ink/10 rounded-xl shadow-[4px_4px_0px_rgba(43,34,27,0.2)] transition-all",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// --- Button Component ---
// Variants: Primary (Gold), Secondary (Wood), Danger (Red), Ghost (Transparent)
export const Button = ({ onClick, children, variant = "primary", className = "", disabled = false, ...props }) => {
  const variants = {
    primary: "bg-highlight-gold hover:bg-[#c5a028] text-ink font-bold shadow-md border-2 border-ink/10",
    secondary: "bg-wood hover:bg-[#3d3023] text-parchment font-medium border-2 border-parchment/20 shadow-md",
    danger: "bg-accent-red/10 text-accent-red hover:bg-accent-red/20 border-2 border-accent-red/50",
    ghost: "text-parchment hover:text-highlight-gold hover:bg-ink/20",
    icon: "p-2 bg-transparent hover:bg-ink/10 text-ink rounded-full"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-6 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Input Component ---
// Parchment style input
export const Input = ({ className, ...props }) => (
  <input
    className={cn(
      "flex h-12 w-full rounded-lg border-2 border-ink/20 bg-parchment px-4 py-2 text-lg text-ink ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink/40 focus-visible:outline-none focus-visible:border-highlight-gold focus-visible:ring-1 focus-visible:ring-highlight-gold disabled:cursor-not-allowed disabled:opacity-50 shadow-inner font-bold",
      className
    )}
    {...props}
  />
);

// --- Badge Component ---
// For highlighting bits of info
export const Badge = ({ className, variant = "default", children, ...props }) => {
  const variants = {
    default: "bg-wood text-parchment",
    outline: "border border-wood text-wood",
    success: "bg-suit-green text-white",
    danger: "bg-accent-red text-white",
    gold: "bg-highlight-gold text-ink"
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
