import { NextRequest, NextResponse } from "next/server";
import {
  getProject,
  updateProject,
  deleteProject,
} from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Project } from "@/lib/types";
import { normalizeProject } from "@/lib/project-normalizers";
import { removeImagesIfUnused } from "@/lib/media-cleanup";

function projectImageCandidates(project: Project): string[] {
  const paths: string[] = [];
  if (typeof project.thumbnail === "string") paths.push(project.thumbnail);
  if (Array.isArray(project.gallery)) paths.push(...project.gallery);
  return paths;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(normalizeProject(project));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await authenticateRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const before = await getProject(id);
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const normalized = normalizeProject({ ...before, ...body, id });
  const next = await updateProject(id, normalized);

  if (!next) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  void removeImagesIfUnused(projectImageCandidates(before));
  return NextResponse.json(next);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await authenticateRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const target = await getProject(id);

  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteProject(id);

  void removeImagesIfUnused(projectImageCandidates(target));
  return NextResponse.json({ success: true });
}
