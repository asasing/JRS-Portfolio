import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getCertifications, reorderCertifications } from "@/lib/data";

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
  if (!(await authenticateRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const orderedIds = extractOrderIds(body);
  if (orderedIds.length === 0) {
    return NextResponse.json(
      { error: "Invalid reorder payload" },
      { status: 400 }
    );
  }

  const idSet = new Set(orderedIds.map((id) => id.toLowerCase()));
  if (idSet.size !== orderedIds.length) {
    return NextResponse.json(
      { error: "Duplicate IDs are not allowed" },
      { status: 400 }
    );
  }

  const certs = await getCertifications();
  if (certs.length !== orderedIds.length) {
    return NextResponse.json(
      { error: "Reorder payload length mismatch" },
      { status: 400 }
    );
  }

  try {
    const reordered = await reorderCertifications(orderedIds);
    return NextResponse.json(reordered);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reorder failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
