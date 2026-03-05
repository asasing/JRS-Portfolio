import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getEngagementModels, updateEngagementModels } from "@/lib/data";
import { EngagementModel } from "@/lib/types";

function normalizeEngagementModels(input: unknown): EngagementModel[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => {
      const row = (item ?? {}) as Partial<EngagementModel>;
      const id = typeof row.id === "string" ? row.id.trim() : "";
      if (!id) return null;

      return {
        id,
        title: typeof row.title === "string" ? row.title.trim() : "",
        description:
          typeof row.description === "string" ? row.description.trim() : "",
        order: Number.isFinite(row.order) ? Number(row.order) : index + 1,
      } satisfies EngagementModel;
    })
    .filter((model): model is EngagementModel => model !== null)
    .sort((a, b) => a.order - b.order)
    .map(
      (model, index): EngagementModel => ({
        ...model,
        order: index + 1,
      })
    );
}

export async function GET() {
  const models = await getEngagementModels();
  return NextResponse.json(models);
}

export async function PUT(req: NextRequest) {
  if (!(await authenticateRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const payload = Array.isArray(body) ? body : body?.models;
  const models = normalizeEngagementModels(payload);
  const saved = await updateEngagementModels(models);

  return NextResponse.json(saved);
}
