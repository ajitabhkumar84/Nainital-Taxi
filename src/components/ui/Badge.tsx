import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "popular" | "limited" | "available" | "soldout" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "popular", size = "md", children, ...props }, ref) => {
    const variants = {
      popular: "bg-sunshine-50 text-sunshine-600 border-sunshine-100",
      limited: "bg-coral-50 text-coral border-coral-100",
      available: "bg-emerald-50 text-emerald-700 border-emerald-100",
      soldout: "bg-slate-100 text-slate-600 border-slate-200",
      secondary: "bg-slate-100 text-slate-700 border-slate-200",
      accent: "bg-sunshine-50 text-sunshine-600 border-sunshine-100",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-[11px]",
      md: "px-2.5 py-1 text-[11px]",
      lg: "px-3 py-1.5 text-xs",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-semibold uppercase tracking-wide border",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
