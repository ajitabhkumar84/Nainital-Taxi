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
      "inline-flex items-center justify-center font-body font-semibold rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-sunshine text-white hover:bg-sunshine-500 shadow-retro-sm",
      secondary:
        "bg-white text-ink border border-slate-300 hover:bg-slate-50",
      whatsapp:
        "bg-whatsapp text-white hover:brightness-95 shadow-retro-sm",
      outline:
        "bg-white text-ink border border-slate-300 hover:bg-slate-50",
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
