import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Project } from "@/lib/types";
import crypto from "crypto";

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

function normalizeProject(project: Partial<Project>): Project {
  return {
    id: project.id || "",
    title: project.title || "",
    category: project.category || "",
    description: project.description || "",
    thumbnail: project.thumbnail || "",
    thumbnailFocusX: normalizeFocusValue(project.thumbnailFocusX, 50),
    thumbnailFocusY: normalizeFocusValue(project.thumbnailFocusY, 50),
    thumbnailZoom: normalizeZoomValue(project.thumbnailZoom, 1),
    gallery: Array.isArray(project.gallery) ? project.gallery : [],
    links: Array.isArray(project.links) ? project.links : [],
    order: normalizeOrderValue(project.order, 0),
  };
}

export async function GET() {
  const projects = await readJsonFile<Project[]>("projects.json");
  return NextResponse.json(projects.map((project) => normalizeProject(project)));
}

export async function POST(req: NextRequest) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const projects = await readJsonFile<Project[]>("projects.json");

  const newProject: Project = normalizeProject({
    id: `proj-${crypto.randomUUID().slice(0, 8)}`,
    title: body.title || "",
    category: body.category || "",
    description: body.description || "",
    thumbnail: body.thumbnail || "",
    thumbnailFocusX: body.thumbnailFocusX,
    thumbnailFocusY: body.thumbnailFocusY,
    thumbnailZoom: body.thumbnailZoom,
    gallery: body.gallery || [],
    links: body.links || [],
    order: body.order ?? projects.length + 1,
  });

  projects.push(newProject);
  await writeJsonFile("projects.json", projects);

  return NextResponse.json(newProject, { status: 201 });
}
