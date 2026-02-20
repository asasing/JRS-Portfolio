"use client";

import Image from "next/image";

interface GlowPhotoProps {
  src: string;
  alt: string;
  className?: string;
  focusX?: number;
  focusY?: number;
  zoom?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function GlowPhoto({
  src,
  alt,
  className = "w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72",
  focusX = 50,
  focusY = 50,
  zoom = 1,
}: GlowPhotoProps) {
  const safeFocusX = clamp(focusX, 0, 100);
  const safeFocusY = clamp(focusY, 0, 100);
  const safeZoom = clamp(zoom, 1, 3);

  return (
    <div className={`relative ${className}`}>
      {/* Animated glow ring */}
      <div
        className="absolute inset-[-4px] rounded-full"
        style={{
          background: "conic-gradient(#06b6d4, #8b5cf6, #d946ef, #06b6d4)",
          animation: "glow-spin 3s linear infinite",
        }}
      />
      {/* Inner dark border */}
      <div className="absolute inset-[2px] rounded-full bg-bg-primary" />
      {/* Photo */}
      <div className="absolute inset-[6px] rounded-full overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          style={{
            objectPosition: `${safeFocusX}% ${safeFocusY}%`,
            transform: `scale(${safeZoom})`,
            transformOrigin: "center",
          }}
          sizes="(max-width: 640px) 160px, (max-width: 768px) 208px, (max-width: 1024px) 256px, 288px"
        />
      </div>
    </div>
  );
}
