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
      popular: "bg-coral text-white",
      limited: "bg-sunshine text-ink",
      available: "bg-green-500 text-white",
      soldout: "bg-ink text-white",
      secondary: "bg-gray-200 text-gray-800",
      accent: "bg-[#FFD93D] text-[#2D3436]",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-3 py-1 text-xs",
      lg: "px-4 py-2 text-sm",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-bold border-2 border-ink",
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
