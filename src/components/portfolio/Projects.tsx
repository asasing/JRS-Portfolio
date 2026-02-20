"use client";

import { useState } from "react";
import Image from "next/image";
import { Project } from "@/lib/types";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SectionHeading from "./SectionHeading";
import ProjectDetail from "./ProjectDetail";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface ProjectsProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [scrollIndex, setScrollIndex] = useState(0);

  const categories = ["All", ...Array.from(new Set(projects.map((p) => p.category)))];
  const filtered = activeCategory === "All"
    ? projects
    : projects.filter((p) => p.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => a.order - b.order);
  const visibleCount = 3;
  const maxScroll = Math.max(0, sorted.length - visibleCount);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setScrollIndex(0);
  };

  return (
    <section id="portfolio" className="portfolio-section">
      <div className="site-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <SectionHeading overline="PORTFOLIO" title="Recent Works" gradientWord="Works" />

          {/* Slider arrows — desktop only */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setScrollIndex(Math.max(0, scrollIndex - 1))}
              disabled={scrollIndex === 0}
              className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:text-accent-purple hover:border-accent-purple transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              <FaChevronLeft size={14} />
            </button>
            <button
              onClick={() => setScrollIndex(Math.min(maxScroll, scrollIndex + 1))}
              disabled={scrollIndex >= maxScroll}
              className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:text-accent-purple hover:border-accent-purple transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              <FaChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 md:mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`pill-button text-xs sm:text-sm transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-accent-purple text-white"
                  : "border border-border-subtle text-text-muted hover:text-text-primary hover:border-accent-purple/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Mobile/Tablet: responsive grid (no slider) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:hidden">
          {sorted.map((project) => (
            <ProjectCard
              key={`mobile-${project.id}`}
              project={project}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>

        {/* Desktop: horizontal slider with 3 visible cards */}
        <div className="hidden lg:block overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-500"
            style={{ transform: `translateX(-${scrollIndex * (100 / visibleCount)}%)` }}
          >
            {sorted.map((project) => (
              <div key={`desktop-${project.id}`} className="min-w-[calc(33.333%-1rem)] flex-shrink-0">
                <ProjectCard
                  project={project}
                  onClick={() => setSelectedProject(project)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project detail modal */}
      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const { ref, isVisible } = useScrollReveal(0.1);
  const focusX = Number.isFinite(project.thumbnailFocusX) ? Number(project.thumbnailFocusX) : 50;
  const focusY = Number.isFinite(project.thumbnailFocusY) ? Number(project.thumbnailFocusY) : 50;
  const zoom = Number.isFinite(project.thumbnailZoom) ? Number(project.thumbnailZoom) : 1;
  const safeFocusX = Math.min(100, Math.max(0, focusX));
  const safeFocusY = Math.min(100, Math.max(0, focusY));
  const safeZoom = Math.min(3, Math.max(1, zoom));

  return (
    <div
      ref={ref}
      className={`cursor-pointer group transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-bg-card mb-4">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            className="object-cover"
            style={{
              objectPosition: `${safeFocusX}% ${safeFocusY}%`,
              transform: `scale(${safeZoom})`,
              transformOrigin: "center",
            }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
        {project.category}
      </p>
      <h3 className="text-base md:text-lg font-semibold text-text-primary group-hover:text-accent-purple transition-colors">
        {project.title}
      </h3>
    </div>
  );
}
