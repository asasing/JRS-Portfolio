"use client";

import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export default function Textarea({ label, className = "", ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-text-muted mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        className={`w-full bg-bg-input border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple transition-colors resize-none ${className}`}
        rows={5}
        {...props}
      />
    </div>
  );
}
