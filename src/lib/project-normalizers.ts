import "server-only";

import { Project } from "@/lib/types";
import { DEFAULT_PROJECT_THUMBNAIL } from "@/lib/constants";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeFocusValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, 0, 100);
}

function normalizeZoomValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, 1, 3);
}

function normalizeOrderValue(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function normalizeThumbnail(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_PROJECT_THUMBNAIL;
  const thumbnail = value.trim();
  return thumbnail || DEFAULT_PROJECT_THUMBNAIL;
}

function normalizeGallery(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeLinks(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((link) => {
      if (typeof link !== "object" || link === null) return null;
      const label = typeof link.label === "string" ? link.label.trim() : "";
      const url = typeof link.url === "string" ? link.url.trim() : "";
      return label || url ? { label, url } : null;
    })
    .filter((item): item is { label: string; url: string } => item !== null);
}

export function normalizeProjectCategories(
  inputCategories: unknown,
  inputCategory: unknown
): string[] {
  const seen = new Set<string>();

  const normalizedFromArray = Array.isArray(inputCategories)
    ? inputCategories
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .filter((label) => {
          const key = label.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
    : [];

  if (normalizedFromArray.length > 0) {
    return normalizedFromArray;
  }

  if (typeof inputCategory !== "string") {
    return [];
  }

  const legacyCategory = inputCategory.trim();
  if (!legacyCategory) {
    return [];
  }

  return [legacyCategory];
}

export function normalizeProject(project: Partial<Project>): Project {
  const normalizedCategories = normalizeProjectCategories(
    project.categories,
    project.category
  );

  return {
    id: project.id || "",
    title: project.title || "",
    category: normalizedCategories[0] || "",
    categories: normalizedCategories,
    description: project.description || "",
    thumbnail: normalizeThumbnail(project.thumbnail),
    thumbnailFocusX: normalizeFocusValue(project.thumbnailFocusX, 50),
    thumbnailFocusY: normalizeFocusValue(project.thumbnailFocusY, 50),
    thumbnailZoom: normalizeZoomValue(project.thumbnailZoom, 1),
    gallery: normalizeGallery(project.gallery),
    links: normalizeLinks(project.links),
    order: normalizeOrderValue(project.order, 0),
  };
}

export function normalizeProjects(projects: Partial<Project>[]): Project[] {
  return projects.map((project) => normalizeProject(project));
}
