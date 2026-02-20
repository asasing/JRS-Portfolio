"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-text-muted mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-bg-input border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
