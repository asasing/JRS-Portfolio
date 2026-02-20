"use client";

import { useCountUp } from "@/hooks/useCountUp";

interface StatsCounterProps {
  label: string;
  value: string;
}

export default function StatsCounter({ label, value }: StatsCounterProps) {
  const { count, ref } = useCountUp(value);

  return (
    <div ref={ref} className="text-right">
      <div className="text-4xl md:text-5xl font-bold text-text-primary mb-1">
        {count}
      </div>
      <div className="text-sm text-text-muted uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
