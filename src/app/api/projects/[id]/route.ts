import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Project } from "@/lib/types";

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projects = await readJsonFile<Project[]>("projects.json");
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(normalizeProject(project));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const projects = await readJsonFile<Project[]>("projects.json");
  const index = projects.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  projects[index] = normalizeProject({ ...projects[index], ...body, id });
  await writeJsonFile("projects.json", projects);

  return NextResponse.json(projects[index]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const projects = await readJsonFile<Project[]>("projects.json");
  const filtered = projects.filter((p) => p.id !== id);

  if (filtered.length === projects.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await writeJsonFile("projects.json", filtered);
  return NextResponse.json({ success: true });
}
