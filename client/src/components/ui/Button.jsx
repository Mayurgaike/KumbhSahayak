import React from 'react';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-color disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    primary: "bg-accent-primary text-white hover:bg-accent-primary/90",
    secondary: "bg-border-color text-text-primary hover:bg-border-color/80",
    danger: "bg-status-sos text-white hover:bg-status-sos/90",
    ghost: "hover:bg-border-color text-text-primary",
  };

  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9",
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";
