"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { FaCloudUploadAlt, FaRedoAlt, FaTimes } from "react-icons/fa";

interface ImageUploaderProps {
  value: string;
  onChange: (path: string) => void;
  category?: string;
  label?: string;
  focusX?: number;
  focusY?: number;
  zoom?: number;
  onFocusChange?: (x: number, y: number, zoom: number) => void;
  enablePositioning?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeFocus(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? clamp(Number(value), 0, 100) : fallback;
}

function normalizeZoom(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? clamp(Number(value), 1, 3) : fallback;
}

export default function ImageUploader({
  value,
  onChange,
  category = "projects",
  label,
  focusX,
  focusY,
  zoom,
  onFocusChange,
  enablePositioning = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startFocusX: number;
    startFocusY: number;
  } | null>(null);

  const normalizedFocusX = normalizeFocus(focusX, 50);
  const normalizedFocusY = normalizeFocus(focusY, 50);
  const normalizedZoom = normalizeZoom(zoom, 1);

  const applyFocus = (x: number, y: number, nextZoom: number) => {
    if (!onFocusChange) return;

    onFocusChange(
      clamp(x, 0, 100),
      clamp(y, 0, 100),
      clamp(nextZoom, 1, 3)
    );
  };

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.path);

        if (!value) {
          applyFocus(50, 50, 1);
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setUploading(false);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enablePositioning || !value || !onFocusChange) return;

    const preview = previewRef.current;
    if (!preview) return;

    preview.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startFocusX: normalizedFocusX,
      startFocusY: normalizedFocusY,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    const preview = previewRef.current;

    if (!dragState || !preview || dragState.pointerId !== event.pointerId) return;

    const rect = preview.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    const sensitivityX = (100 / rect.width) / normalizedZoom;
    const sensitivityY = (100 / rect.height) / normalizedZoom;

    applyFocus(
      dragState.startFocusX - deltaX * sensitivityX,
      dragState.startFocusY - deltaY * sensitivityY,
      normalizedZoom
    );
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    const preview = previewRef.current;

    if (dragState && preview && dragState.pointerId === event.pointerId) {
      if (preview.hasPointerCapture(event.pointerId)) {
        preview.releasePointerCapture(event.pointerId);
      }
      dragRef.current = null;
      setDragging(false);
    }
  };

  const canPosition = enablePositioning && !!value;

  return (
    <div>
      {label && <label className="block text-sm text-text-muted mb-2">{label}</label>}

      {value ? (
        <div
          ref={previewRef}
          className={`relative w-full aspect-video rounded-lg overflow-hidden bg-bg-input border border-border-subtle ${
            canPosition ? "cursor-grab" : ""
          } ${dragging ? "cursor-grabbing" : ""}`}
          style={canPosition ? { touchAction: "none" } : undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
            style={{
              objectPosition: `${normalizedFocusX}% ${normalizedFocusY}%`,
              transform: `scale(${normalizedZoom})`,
              transformOrigin: "center",
            }}
            sizes="400px"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="w-full aspect-video rounded-lg border-2 border-dashed border-border-subtle hover:border-accent-purple flex flex-col items-center justify-center gap-2 text-text-muted hover:text-accent-purple transition-colors cursor-pointer disabled:opacity-60"
        >
          <FaCloudUploadAlt size={24} />
          <span className="text-sm">{uploading ? "Uploading..." : "Click to upload"}</span>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border-subtle text-sm text-text-secondary hover:text-accent-purple hover:border-accent-purple transition-colors cursor-pointer disabled:opacity-60"
        >
          {value ? <FaRedoAlt size={12} /> : <FaCloudUploadAlt size={12} />}
          {uploading ? "Uploading..." : value ? "Replace Image" : "Upload Image"}
        </button>

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              applyFocus(50, 50, 1);
            }}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border-subtle text-sm text-text-secondary hover:text-accent-pink hover:border-accent-pink transition-colors cursor-pointer disabled:opacity-60"
          >
            <FaTimes size={12} />
            Remove
          </button>
        )}
      </div>

      {canPosition && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-text-muted">Drag image to reposition.</p>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-text-muted uppercase tracking-wider">Zoom</label>
              <span className="text-xs text-text-muted">{normalizedZoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={normalizedZoom}
              onChange={(e) => applyFocus(normalizedFocusX, normalizedFocusY, Number(e.target.value))}
              className="w-full accent-accent-purple"
            />
          </div>

          <button
            type="button"
            onClick={() => applyFocus(50, 50, 1)}
            className="text-xs text-text-secondary hover:text-accent-purple cursor-pointer"
          >
            Reset Position
          </button>
        </div>
      )}

      <div className="mt-3">
        <label className="block text-xs text-text-muted mb-2 uppercase tracking-wider">Image Path (Optional)</label>
        <input
          type="text"
          placeholder="/images/..."
          value={value}
          onChange={(e) => {
            const nextPath = e.target.value;
            onChange(nextPath);

            if (!nextPath.trim()) {
              applyFocus(50, 50, 1);
            }
          }}
          className="w-full bg-bg-input border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple transition-colors"
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}
