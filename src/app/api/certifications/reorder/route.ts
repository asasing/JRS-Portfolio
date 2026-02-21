import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { Certification } from "@/lib/types";

function extractOrderIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  if (input.every((item) => typeof item === "string")) {
    return input.map((item) => item.trim()).filter(Boolean);
  }

  return input
    .map((item) =>
      typeof item === "object" && item !== null && typeof item.id === "string"
        ? item.id.trim()
        : ""
    )
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

  const certs = await readJsonFile<Certification[]>("certifications.json");
  if (certs.length !== orderedIds.length) {
    return NextResponse.json({ error: "Reorder payload length mismatch" }, { status: 400 });
  }

  const certMap = new Map(certs.map((cert) => [cert.id, cert]));
  const reordered: Certification[] = [];

  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    const existing = certMap.get(id);
    if (!existing) {
      return NextResponse.json({ error: `Unknown certification ID: ${id}` }, { status: 400 });
    }
    reordered.push({ ...existing, order: index + 1 });
  }

  await writeJsonFile("certifications.json", reordered);
  return NextResponse.json(reordered);
}
