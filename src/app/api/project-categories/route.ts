import { NextRequest, NextResponse } from "next/server";
import {
  getProjects,
  getProjectCategories,
  updateProjectCategories,
  updateProject,
} from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Project, ProjectCategory } from "@/lib/types";
import { normalizeProject } from "@/lib/project-normalizers";
import {
  normalizeProjectCategoryList,
  toProjectCategoryLabelSet,
} from "@/lib/project-category-normalizers";

export async function GET() {
  const projects = await getProjects();
  const storedCategories = await getProjectCategories();
  const categories = normalizeProjectCategoryList(storedCategories, projects);
  return NextResponse.json(categories);
}

export async function PUT(req: NextRequest) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const inputCategories = Array.isArray(body) ? body : body?.categories;

  const projects = await getProjects();
  const existingCategories = await getProjectCategories();
  const normalizedExisting = normalizeProjectCategoryList(
    existingCategories,
    projects
  );

  const categories = normalizeProjectCategoryList(inputCategories, projects, {
    useFallbackWhenEmpty: false,
  });
  const allowedLabels = toProjectCategoryLabelSet(categories);
  const previousById = new Map(
    normalizedExisting.map(
      (category: ProjectCategory) => [category.id, category.label] as const
    )
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

  for (const project of projects) {
    const dedupe = new Set<string>();
    const filteredCategories = (project.categories || [])
      .map((label: string) => {
        const key = label.toLowerCase();
        return renamedLabels.get(key) || label;
      })
      .filter((label: string) => allowedLabels.has(label.toLowerCase()))
      .filter((label: string) => {
        const key = label.toLowerCase();
        if (dedupe.has(key)) return false;
        dedupe.add(key);
        return true;
      });

    const updatedProject: Project = normalizeProject({
      ...project,
      categories: filteredCategories,
      category: filteredCategories[0] || "",
    });

    await updateProject(project.id, updatedProject);
  }

  const saved = await updateProjectCategories(categories);
  return NextResponse.json(saved);
}
