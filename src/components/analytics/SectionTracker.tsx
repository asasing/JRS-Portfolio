"use client";

import { useEffect, useRef } from "react";
import { capture } from "@/lib/analytics";

const SECTIONS = ["about", "services", "portfolio", "certifications", "contact"] as const;

export default function SectionTracker() {
  const viewed = useRef(new Set<string>());
  const enteredAt = useRef<Record<string, number>>({});

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            enteredAt.current[id] = Date.now();
            if (!viewed.current.has(id)) {
              viewed.current.add(id);
              capture("section_viewed", { section: id });
            }
          } else if (enteredAt.current[id]) {
            const dwell = Math.round((Date.now() - enteredAt.current[id]) / 1000);
            capture("section_left", { section: id, dwell_seconds: dwell });
            delete enteredAt.current[id];
          }
        },
        { threshold: 0.3 }
      );

      observer.observe(el);
      observers.push(observer);
    }

    return () => {
      for (const obs of observers) obs.disconnect();
    };
  }, []);

  return null;
}
