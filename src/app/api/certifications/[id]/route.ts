import { NextRequest, NextResponse } from "next/server";
import {
  getCertification,
  updateCertification,
  deleteCertification,
} from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { sanitizePaletteCode } from "@/lib/certification-palettes";
import { removeImagesIfUnused } from "@/lib/media-cleanup";

function normalizeCredentialUrl(url: unknown): string {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeCredentialId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeThumbnailPath(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cert = await getCertification(id);

  if (!cert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...cert,
    credentialId: normalizeCredentialId(cert.credentialId),
    thumbnail: normalizeThumbnailPath(cert.thumbnail),
    paletteCode: sanitizePaletteCode(cert.paletteCode, cert.organization),
  });
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

  const existing = await getCertification(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const previousThumbnail = normalizeThumbnailPath(existing.thumbnail);

  const updated = await updateCertification(id, {
    ...body,
    credentialUrl:
      typeof body.credentialUrl === "string"
        ? normalizeCredentialUrl(body.credentialUrl)
        : existing.credentialUrl || "",
    credentialId:
      typeof body.credentialId === "string"
        ? normalizeCredentialId(body.credentialId)
        : normalizeCredentialId(existing.credentialId),
    thumbnail:
      typeof body.thumbnail === "string"
        ? normalizeThumbnailPath(body.thumbnail)
        : normalizeThumbnailPath(existing.thumbnail),
    paletteCode: sanitizePaletteCode(
      body.paletteCode ?? existing.paletteCode,
      body.organization ?? existing.organization
    ),
  });

  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  void removeImagesIfUnused([previousThumbnail]);
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await authenticateRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const target = await getCertification(id);

  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteCertification(id);

  void removeImagesIfUnused([normalizeThumbnailPath(target.thumbnail)]);
  return NextResponse.json({ success: true });
}
