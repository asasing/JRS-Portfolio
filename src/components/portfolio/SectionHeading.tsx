"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

interface SectionHeadingProps {
  overline: string;
  title: string;
  gradientWord: string;
}

export default function SectionHeading({ overline, title, gradientWord }: SectionHeadingProps) {
  const { ref, isVisible } = useScrollReveal();

  const titleParts = title.split(gradientWord);

  return (
    <div
      ref={ref}
      className={`mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <span className="text-xs uppercase tracking-[0.3em] text-text-muted flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-accent-purple" />
        {overline}
      </span>
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary">
        {titleParts[0]}
        <span className="gradient-text">{gradientWord}</span>
        {titleParts[1] || ""}
      </h2>
    </div>
  );
}
