"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gradient" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "admin";
}

export default function Button({
  variant = "gradient",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center whitespace-nowrap leading-tight font-medium transition-all duration-300 rounded-full cursor-pointer";

  const variants = {
    gradient: "bg-gradient-to-r from-accent-purple to-accent-magenta text-white hover:opacity-90 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]",
    outline: "border border-border-subtle text-text-primary hover:border-accent-purple hover:text-accent-purple",
    ghost: "text-text-secondary hover:text-text-primary",
  };

  const sizes = {
    sm: "px-6 py-3 text-sm",
    md: "px-9 py-4 text-sm",
    lg: "px-12 py-5 text-base",
    admin: "px-6 py-3 text-sm",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
