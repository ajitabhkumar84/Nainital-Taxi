import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "whatsapp" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, asChild, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-body font-bold border-3 border-ink rounded-lg transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-sunshine text-ink shadow-retro hover:shadow-retro-pressed active:shadow-none",
      secondary:
        "bg-teal text-white shadow-retro hover:shadow-retro-pressed active:shadow-none",
      whatsapp:
        "bg-whatsapp text-white shadow-retro hover:shadow-retro-pressed active:shadow-none",
      outline:
        "bg-white text-ink shadow-retro hover:shadow-retro-pressed active:shadow-none",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const classes = cn(baseStyles, variants[variant], sizes[size], className);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...children.props,
        className: cn(children.props.className, classes),
      } as any);
    }

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
