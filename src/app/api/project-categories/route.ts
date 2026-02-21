import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Project, ProjectCategory } from "@/lib/types";
import { normalizeProject } from "@/lib/project-normalizers";
import {
  normalizeProjectCategoryList,
  toProjectCategoryLabelSet,
} from "@/lib/project-category-normalizers";

async function loadNormalizedProjects(): Promise<Project[]> {
  const projects = await readJsonFile<Project[]>("projects.json");
  return projects.map((project) => normalizeProject(project));
}

async function loadCategories(projects: Project[]): Promise<ProjectCategory[]> {
  let inputCategories: unknown = [];

  try {
    inputCategories = await readJsonFile<Partial<ProjectCategory>[]>(
      "project-categories.json"
    );
  } catch {
    inputCategories = [];
  }

  return normalizeProjectCategoryList(inputCategories, projects);
}

export async function GET() {
  const projects = await loadNormalizedProjects();
  const categories = await loadCategories(projects);
  return NextResponse.json(categories);
}

export async function PUT(req: NextRequest) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const inputCategories = Array.isArray(body) ? body : body?.categories;

  const projects = await loadNormalizedProjects();
  const existingCategories = await loadCategories(projects);
  const categories = normalizeProjectCategoryList(inputCategories, projects, {
    useFallbackWhenEmpty: false,
  });
  const allowedLabels = toProjectCategoryLabelSet(categories);
  const previousById = new Map(
    existingCategories.map((category) => [category.id, category.label] as const)
  );
  const renamedLabels = new Map<string, string>();

  for (const category of categories) {
    const previousLabel = previousById.get(category.id);
    if (!previousLabel) continue;

    const previousKey = previousLabel.toLowerCase();
    const nextLabel = category.label;
    if (previousKey !== nextLabel.toLowerCase()) {
      renamedLabels.set(previousKey, nextLabel);
    }
  }

  const updatedProjects = projects.map((project) => {
    const dedupe = new Set<string>();
    const filteredCategories = (project.categories || [])
      .map((label) => {
        const key = label.toLowerCase();
        return renamedLabels.get(key) || label;
      })
      .filter((label) => allowedLabels.has(label.toLowerCase()))
      .filter((label) => {
        const key = label.toLowerCase();
        if (dedupe.has(key)) return false;
        dedupe.add(key);
        return true;
      });

    return normalizeProject({
      ...project,
      categories: filteredCategories,
      category: filteredCategories[0] || "",
    });
  });

  await writeJsonFile("project-categories.json", categories);
  await writeJsonFile("projects.json", updatedProjects);

  return NextResponse.json(categories);
}
