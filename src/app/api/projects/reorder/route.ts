import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { Project } from "@/lib/types";
import { normalizeProject } from "@/lib/project-normalizers";

function extractOrderIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  if (input.every((item) => typeof item === "string")) {
    return input.map((item) => item.trim()).filter(Boolean);
  }

  return input
    .map((item) => {
      if (typeof item !== "object" || item === null) return "";
      const id = (item as { id?: unknown }).id;
      return typeof id === "string" ? id.trim() : "";
    })
    .filter(Boolean);
}

export async function PUT(req: NextRequest) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const orderedIds = extractOrderIds(body);

  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "Invalid reorder payload" }, { status: 400 });
  }

  const idSet = new Set(orderedIds.map((id) => id.toLowerCase()));
  if (idSet.size !== orderedIds.length) {
    return NextResponse.json({ error: "Duplicate IDs are not allowed" }, { status: 400 });
  }

  const projects = await readJsonFile<Project[]>("projects.json");
  if (projects.length !== orderedIds.length) {
    return NextResponse.json({ error: "Reorder payload length mismatch" }, { status: 400 });
  }

  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const reordered: Project[] = [];

  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    const existing = projectMap.get(id);
    if (!existing) {
      return NextResponse.json({ error: `Unknown project ID: ${id}` }, { status: 400 });
    }
    reordered.push(normalizeProject({ ...existing, order: index + 1 }));
  }

  await writeJsonFile("projects.json", reordered);
  return NextResponse.json(reordered);
}
