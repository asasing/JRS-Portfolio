import "server-only";

import { Project, ProjectCategory } from "@/lib/types";
import { normalizeProjectCategories } from "@/lib/project-normalizers";

function normalizeLabel(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

function buildCategoryId(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `cat-${slug || "item"}`;
}

function normalizeOrder(input: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(input ?? fallback), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNormalizedEntries(input: unknown): { id: string; label: string; order: number }[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => {
      if (typeof item !== "object" || item === null) return null;
      const label = normalizeLabel((item as Partial<ProjectCategory>).label);
      if (!label) return null;

      const rawId = normalizeLabel((item as Partial<ProjectCategory>).id);
      return {
        id: rawId || buildCategoryId(label),
        label,
        order: normalizeOrder((item as Partial<ProjectCategory>).order, index + 1),
      };
    })
    .filter((item): item is { id: string; label: string; order: number } => item !== null);
}

export function deriveProjectCategoriesFromProjects(
  projects: Partial<Project>[]
): ProjectCategory[] {
  const seen = new Set<string>();

  const orderedProjects = [...projects].sort((a, b) => {
    const aOrder = Number.isFinite(a.order) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(b.order) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });

  const labels: string[] = [];

  for (const project of orderedProjects) {
    const projectLabels = normalizeProjectCategories(
      project.categories,
      project.category
    );

    for (const label of projectLabels) {
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      labels.push(label);
    }
  }

  return labels.map((label, index) => ({
    id: buildCategoryId(label),
    label,
    order: index + 1,
  }));
}

export function normalizeProjectCategoryList(
  input: unknown,
  fallbackProjects: Partial<Project>[] = [],
  options?: { useFallbackWhenEmpty?: boolean }
): ProjectCategory[] {
  const useFallbackWhenEmpty = options?.useFallbackWhenEmpty ?? true;
  const seenLabels = new Set<string>();
  const seenIds = new Set<string>();

  const normalized = toNormalizedEntries(input)
    .sort((a, b) => a.order - b.order)
    .filter((entry) => {
      const labelKey = entry.label.toLowerCase();
      if (seenLabels.has(labelKey)) return false;
      seenLabels.add(labelKey);
      return true;
    })
    .map((entry) => {
      let id = entry.id;
      if (!id || seenIds.has(id)) {
        const baseId = buildCategoryId(entry.label);
        id = baseId;
        let suffix = 2;
        while (seenIds.has(id)) {
          id = `${baseId}-${suffix}`;
          suffix += 1;
        }
      }
      seenIds.add(id);
      return {
        id,
        label: entry.label,
        order: entry.order,
      };
    });

  const fallback = normalized.length > 0 || !useFallbackWhenEmpty
    ? normalized
    : deriveProjectCategoriesFromProjects(fallbackProjects);

  return fallback.map((entry, index) => ({
    id: entry.id,
    label: entry.label,
    order: index + 1,
  }));
}

export function toProjectCategoryLabelSet(categories: ProjectCategory[]): Set<string> {
  return new Set(categories.map((category) => category.label.toLowerCase()));
}
