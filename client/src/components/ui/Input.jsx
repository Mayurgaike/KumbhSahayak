import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full border border-border-color bg-bg-base px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary disabled:cursor-not-allowed disabled:opacity-50 text-text-primary",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
