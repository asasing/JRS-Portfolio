"use client";

import { useState } from "react";
import Image from "next/image";
import { Project } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { FaChevronLeft, FaChevronRight, FaTimes, FaExternalLinkAlt } from "react-icons/fa";
import { DEFAULT_PROJECT_THUMBNAIL } from "@/lib/constants";

interface ProjectDetailProps {
  project: Project;
  onClose: () => void;
}

function getProjectCategories(project: Project): string[] {
  const categories = Array.isArray(project.categories)
    ? project.categories
        .map((label) => label.trim())
        .filter(Boolean)
    : [];

  if (categories.length > 0) return categories;

  const legacy = project.category?.trim() || "";
  return legacy ? [legacy] : [];
}

export default function ProjectDetail({ project, onClose }: ProjectDetailProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const fallbackThumbnail = project.thumbnail?.trim() || DEFAULT_PROJECT_THUMBNAIL;
  const validGallery = project.gallery
    .map((image) => image.trim())
    .filter(Boolean);
  const activeImage = validGallery[currentImage] || validGallery[0] || fallbackThumbnail;
  const categoryLabel = getProjectCategories(project).join(" • ");

  const prevImage = () => {
    setCurrentImage((prev) =>
      prev === 0 ? validGallery.length - 1 : prev - 1
    );
  };

  const nextImage = () => {
    setCurrentImage((prev) =>
      prev === validGallery.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6 md:p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent-purple transition-colors z-10 cursor-pointer"
        >
          <FaTimes size={16} />
        </button>

        {/* Gallery slider */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-bg-primary mb-6">
          {activeImage && (
            <Image
              src={activeImage}
              alt={`${project.title} - Image ${currentImage + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          )}

          {/* Navigation arrows */}
          {validGallery.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-accent-purple/80 transition-colors cursor-pointer"
              >
                <FaChevronLeft size={18} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-accent-purple/80 transition-colors cursor-pointer"
              >
                <FaChevronRight size={18} />
              </button>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-sm text-white">
                {currentImage + 1} / {validGallery.length}
              </div>
            </>
          )}
        </div>

        {/* Gallery dots */}
        {validGallery.length > 1 && (
          <div className="flex justify-center gap-2 mb-6">
            {validGallery.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                  i === currentImage ? "bg-accent-purple" : "bg-border-subtle"
                }`}
              />
            ))}
          </div>
        )}

        {/* Project info */}
        <div>
          <span className="text-xs text-text-muted uppercase tracking-wider">
            {categoryLabel || "Uncategorized"}
          </span>
          <h3 className="text-2xl font-bold text-text-primary mt-1 mb-3">
            {project.title}
          </h3>
          <div
            className="bio-content text-text-secondary leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />

          {/* Links */}
          <div className="flex flex-wrap gap-3">
            {project.links.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <span className="flex items-center gap-2">
                    {link.label}
                    <FaExternalLinkAlt size={10} />
                  </span>
                </Button>
              </a>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
