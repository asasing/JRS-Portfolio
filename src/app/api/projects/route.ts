import { NextRequest, NextResponse } from "next/server";
import { getProjects, createProject } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Project } from "@/lib/types";
import crypto from "crypto";
import { normalizeProject, normalizeProjects } from "@/lib/project-normalizers";

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json(normalizeProjects(projects));
}

export async function POST(req: NextRequest) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const projects = await getProjects();

  const newProject: Project = normalizeProject({
    id: `proj-${crypto.randomUUID().slice(0, 8)}`,
    title: body.title || "",
    category: body.category || "",
    categories: body.categories,
    description: body.description || "",
    thumbnail: body.thumbnail || "",
    thumbnailFocusX: body.thumbnailFocusX,
    thumbnailFocusY: body.thumbnailFocusY,
    thumbnailZoom: body.thumbnailZoom,
    gallery: body.gallery || [],
    links: body.links || [],
    order: body.order ?? projects.length + 1,
  });

  const saved = await createProject(newProject);
  return NextResponse.json(saved, { status: 201 });
}
