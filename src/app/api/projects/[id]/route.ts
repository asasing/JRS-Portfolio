import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Project } from "@/lib/types";
import { normalizeProject } from "@/lib/project-normalizers";

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
