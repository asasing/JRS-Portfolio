import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getPageSections, updatePageSections } from "@/lib/data";
import { PageSection } from "@/lib/types";

function normalizeContent(value: unknown): PageSection["content"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as PageSection["content"];
}

function normalizePageSections(input: unknown): PageSection[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => {
      const row = (item ?? {}) as Partial<PageSection>;
      const id = typeof row.id === "string" ? row.id.trim() : "";
      const key = typeof row.key === "string" ? row.key.trim() : "";
      if (!id || !key) return null;

      return {
        id,
        key,
        label:
          typeof row.label === "string" && row.label.trim().length > 0
            ? row.label.trim()
            : key,
        order: Number.isFinite(row.order) ? Number(row.order) : index + 1,
        visible: row.visible !== false,
        isCustom: row.isCustom === true,
        content: normalizeContent(row.content),
      } satisfies PageSection;
    })
    .filter((section): section is PageSection => section !== null)
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({ ...section, order: index + 1 }));
}

export async function GET() {
  const sections = await getPageSections();
  return NextResponse.json(sections);
}

export async function PUT(req: NextRequest) {
  if (!(await authenticateRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const payload = Array.isArray(body) ? body : body?.sections;
  const sections = normalizePageSections(payload);
  const saved = await updatePageSections(sections);

  return NextResponse.json(saved);
}
