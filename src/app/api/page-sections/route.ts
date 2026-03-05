import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getPageSections, updatePageSections } from "@/lib/data";
import { PageSection } from "@/lib/types";

function normalizeContent(value: unknown): PageSection["content"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const normalized: NonNullable<PageSection["content"]> = {};

  if (typeof raw.title === "string") normalized.title = raw.title;
  if (typeof raw.bodyHtml === "string") normalized.bodyHtml = raw.bodyHtml;
  if (typeof raw.heading === "string") normalized.heading = raw.heading;
  if (typeof raw.intro === "string") normalized.intro = raw.intro;

  if (Array.isArray(raw.items)) {
    normalized.items = raw.items
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(raw.steps)) {
    normalized.steps = raw.steps
      .map(
        (
          step
        ): { title: string; description: string; image?: string } | null => {
        if (!step || typeof step !== "object" || Array.isArray(step)) return null;
        const row = step as Record<string, unknown>;
        const normalizedStep: { title: string; description: string; image?: string } = {
          title: typeof row.title === "string" ? row.title : "",
          description: typeof row.description === "string" ? row.description : "",
        };
        if (typeof row.image === "string") {
          normalizedStep.image = row.image;
        }
        return normalizedStep;
      })
      .filter(
        (step): step is { title: string; description: string; image?: string } =>
          step !== null
      );
  }

  return normalized;
}

function normalizePageSections(input: unknown): PageSection[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index): PageSection | null => {
      const row = (item ?? {}) as Partial<PageSection>;
      const id = typeof row.id === "string" ? row.id.trim() : "";
      const key = typeof row.key === "string" ? row.key.trim() : "";
      if (!id || !key) return null;
      const content = normalizeContent(row.content);
      const normalized: PageSection = {
        id,
        key,
        label:
          typeof row.label === "string" && row.label.trim().length > 0
            ? row.label.trim()
            : key,
        order: Number.isFinite(row.order) ? Number(row.order) : index + 1,
        visible: row.visible !== false,
        isCustom: row.isCustom === true,
      };
      if (content !== undefined) {
        normalized.content = content;
      }
      return normalized;
    })
    .filter((section): section is PageSection => section !== null)
    .sort((a, b) => a.order - b.order)
    .map(
      (section, index): PageSection => ({
        ...section,
        order: index + 1,
      })
    );
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
