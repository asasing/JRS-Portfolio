"use client";

import { useEffect, useMemo, useRef, useState, type WheelEvent } from "react";
import Image from "next/image";
import { Project, ProjectCategory } from "@/lib/types";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SectionHeading from "./SectionHeading";
import ProjectDetail from "./ProjectDetail";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { DEFAULT_PROJECT_THUMBNAIL } from "@/lib/constants";

interface ProjectsProps {
  projects: Project[];
  projectCategories: ProjectCategory[];
}

function getProjectCategories(project: Project): string[] {
  const fromArray = Array.isArray(project.categories)
    ? project.categories
        .map((label) => label.trim())
        .filter(Boolean)
    : [];

  if (fromArray.length > 0) return fromArray;

  const legacy = project.category?.trim() || "";
  return legacy ? [legacy] : [];
}

function matchesCategory(project: Project, category: string): boolean {
  if (category === "All") return true;
  const target = category.toLowerCase();
  return getProjectCategories(project).some((label) => label.toLowerCase() === target);
}

export default function Projects({ projects, projectCategories }: ProjectsProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const desktopRailRef = useRef<HTMLDivElement>(null);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => a.order - b.order),
    [projects]
  );

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const labels: string[] = [];

    const fromManaged = [...projectCategories]
      .sort((a, b) => a.order - b.order)
      .map((category) => category.label.trim())
      .filter(Boolean);

    for (const label of fromManaged) {
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      labels.push(label);
    }

    for (const project of sortedProjects) {
      for (const label of getProjectCategories(project)) {
        const key = label.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        labels.push(label);
      }
    }

    return ["All", ...labels];
  }, [projectCategories, sortedProjects]);

  const filteredProjects = useMemo(
    () => sortedProjects.filter((project) => matchesCategory(project, activeCategory)),
    [activeCategory, sortedProjects]
  );

  const updateScrollState = () => {
    const rail = desktopRailRef.current;
    if (!rail) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const maxLeft = rail.scrollWidth - rail.clientWidth;
    setCanScrollLeft(rail.scrollLeft > 2);
    setCanScrollRight(rail.scrollLeft < maxLeft - 2);
  };

  const scrollByCard = (direction: -1 | 1) => {
    const rail = desktopRailRef.current;
    if (!rail) return;

    const firstCard = rail.querySelector("[data-project-card='true']") as HTMLElement | null;
    const scrollAmount = firstCard ? firstCard.offsetWidth + 24 : rail.clientWidth * 0.9;

    rail.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  };

  const handleRailWheel = (event: WheelEvent<HTMLDivElement>) => {
    const rail = desktopRailRef.current;
    if (!rail) return;

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    rail.scrollBy({ left: event.deltaY });
  };

  useEffect(() => {
    const rail = desktopRailRef.current;
    if (!rail) return;

    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();

    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const frame = window.requestAnimationFrame(() => updateScrollState());

    return () => {
      window.cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [filteredProjects.length]);

  useEffect(() => {
    const rail = desktopRailRef.current;
    if (!rail) return;

    rail.scrollTo({ left: 0, behavior: "smooth" });
    const frame = window.requestAnimationFrame(() => updateScrollState());
    return () => window.cancelAnimationFrame(frame);
  }, [activeCategory]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory((prev) => (prev === category ? "All" : category));
  };

  return (
    <section id="portfolio" className="portfolio-section">
      <div className="site-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <SectionHeading overline="PORTFOLIO" title="Recent Works" gradientWord="Works" />
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 md:mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`pill-button text-xs sm:text-sm transition-colors cursor-pointer ${
                activeCategory === category
                  ? "bg-accent-purple text-white"
                  : "border border-border-subtle text-text-muted hover:text-text-primary hover:border-accent-purple/50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:hidden">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={`mobile-${project.id}`}
              project={project}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>

        <div className="relative hidden lg:block">
          <div
            ref={desktopRailRef}
            className="overflow-x-auto scroll-smooth pb-2"
            onWheel={handleRailWheel}
          >
            <div className="flex gap-6 w-max pr-2">
              {filteredProjects.map((project) => (
                <div
                  key={`desktop-${project.id}`}
                  data-project-card="true"
                  className="min-w-[340px] xl:min-w-[360px] 2xl:min-w-[380px] h-full"
                >
                  <ProjectCard
                    project={project}
                    onClick={() => setSelectedProject(project)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between lg:flex">
            <button
              onClick={() => scrollByCard(-1)}
              disabled={!canScrollLeft}
              className="pointer-events-auto ml-1 h-11 w-11 rounded-full border border-border-subtle bg-black/55 backdrop-blur-sm flex items-center justify-center text-text-secondary hover:text-accent-purple hover:border-accent-purple transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer"
            >
              <FaChevronLeft size={14} />
            </button>
            <button
              onClick={() => scrollByCard(1)}
              disabled={!canScrollRight}
              className="pointer-events-auto mr-1 h-11 w-11 rounded-full border border-border-subtle bg-black/55 backdrop-blur-sm flex items-center justify-center text-text-secondary hover:text-accent-purple hover:border-accent-purple transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer"
            >
              <FaChevronRight size={14} />
            </button>
          </div>
        </div>

        {filteredProjects.length === 0 && (
          <div className="mt-6 rounded-xl border border-border-subtle bg-bg-card px-6 py-8 text-sm text-text-muted">
            No projects found in this category.
          </div>
        )}
      </div>

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
  const safeThumbnail = project.thumbnail?.trim() || DEFAULT_PROJECT_THUMBNAIL;
  const projectCategories = getProjectCategories(project);
  const categoryLabel = projectCategories.join(" • ");
  const focusX = Number.isFinite(project.thumbnailFocusX) ? Number(project.thumbnailFocusX) : 50;
  const focusY = Number.isFinite(project.thumbnailFocusY) ? Number(project.thumbnailFocusY) : 50;
  const zoom = Number.isFinite(project.thumbnailZoom) ? Number(project.thumbnailZoom) : 1;
  const safeFocusX = Math.min(100, Math.max(0, focusX));
  const safeFocusY = Math.min(100, Math.max(0, focusY));
  const safeZoom = Math.min(3, Math.max(1, zoom));

  return (
    <div
      ref={ref}
      className={`cursor-pointer group h-full flex flex-col transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-bg-card mb-4">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <Image
            src={safeThumbnail}
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
      <p className="project-card-category text-xs text-text-muted uppercase tracking-wider mb-1">
        {categoryLabel || "Uncategorized"}
      </p>
      <h3 className="project-card-title text-base md:text-lg font-semibold text-text-primary group-hover:text-accent-purple transition-colors min-h-[3.2rem] md:min-h-[3.4rem]">
        {project.title}
      </h3>
    </div>
  );
}

