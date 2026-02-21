"use client";

import { useRef, useState } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";

interface MultiImageUploaderProps {
  onUploadComplete: (paths: string[]) => void;
  category?: string;
  label?: string;
}

export default function MultiImageUploader({
  onUploadComplete,
  category = "projects",
  label = "Upload Images",
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setUploading(true);
    setError("");

    const uploadedPaths: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Upload failed");
        }

        const data = await res.json();
        if (typeof data.path === "string" && data.path.trim()) {
          uploadedPaths.push(data.path.trim());
        }
      } catch {
        setError("Some files failed to upload. Please retry.");
      }
    }

    if (uploadedPaths.length > 0) {
      onUploadComplete(uploadedPaths);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setUploading(false);
  };

  return (
    <div>
      <label className="block text-sm text-text-muted mb-2">{label}</label>
      <button
        type="button"
        onClick={openPicker}
        disabled={uploading}
        className="w-full rounded-lg border-2 border-dashed border-border-subtle hover:border-accent-purple bg-bg-input px-4 py-6 text-text-muted hover:text-accent-purple transition-colors disabled:opacity-60 cursor-pointer"
      >
        <span className="inline-flex items-center gap-2 text-sm">
          <FaCloudUploadAlt size={16} />
          {uploading ? "Uploading..." : "Click to upload multiple images"}
        </span>
      </button>

      {error && <p className="mt-2 text-xs text-accent-pink">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
    </div>
  );
}
