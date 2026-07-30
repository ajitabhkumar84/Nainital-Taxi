import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full h-11 px-3.5 border border-slate-300 rounded-md bg-slate-50 font-body text-ink placeholder:text-slate-400 focus:outline-none focus:border-sunshine focus:ring-4 focus:ring-sunshine-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full px-3.5 py-3 border border-slate-300 rounded-md bg-slate-50 font-body text-ink placeholder:text-slate-400 focus:outline-none focus:border-sunshine focus:ring-4 focus:ring-sunshine-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[120px] resize-y",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full h-11 px-3.5 border border-slate-300 rounded-md bg-slate-50 font-body text-ink focus:outline-none focus:border-sunshine focus:ring-4 focus:ring-sunshine-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5", className)}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = "Label";

export { Input, Textarea, Select, Label };
