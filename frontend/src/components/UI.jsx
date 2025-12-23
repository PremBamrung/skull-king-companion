import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Card Component ---
// Uses modern bone/parchment background with charcoal text and soft shadows
export const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      "bg-white text-brand-charcoal border border-brand-slate/10 rounded-xl shadow-xl transition-all",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// --- Button Component ---
// Variants: Primary (Oxblood), Secondary (Teal), Danger (Red), Ghost (Transparent)
export const Button = ({ onClick, children, variant = "primary", className = "", disabled = false, ...props }) => {
  const variants = {
    primary: "bg-brand-oxblood hover:bg-[#8e342c] text-white font-bold shadow-lg transition-all active:translate-y-0.5",
    secondary: "bg-brand-teal hover:bg-[#006668] text-white font-medium shadow-md transition-all active:translate-y-0.5",
    danger: "bg-red-50 text-brand-oxblood hover:bg-red-100 border border-brand-oxblood/20",
    ghost: "text-brand-navy hover:text-brand-teal hover:bg-brand-navy/5",
    icon: "p-2 bg-transparent hover:bg-brand-navy/5 text-brand-navy rounded-full"
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
// Modern minimalist input
export const Input = ({ className, ...props }) => (
  <input
    className={cn(
      "flex h-12 w-full rounded-lg border border-brand-slate/20 bg-white px-4 py-2 text-lg text-brand-charcoal placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal disabled:cursor-not-allowed disabled:opacity-50 transition-all",
      className
    )}
    {...props}
  />
);

// --- Badge Component ---
// Updated with modern suit colors
export const Badge = ({ className, variant = "default", children, ...props }) => {
  const variants = {
    default: "bg-brand-navy text-white",
    outline: "border border-brand-navy text-brand-navy",
    success: "bg-suit-green text-white",
    danger: "bg-brand-oxblood text-white",
    gold: "bg-suit-yellow text-brand-charcoal"
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
