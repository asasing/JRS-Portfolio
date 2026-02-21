import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Certification } from "@/lib/types";
import { sanitizePaletteCode } from "@/lib/certification-palettes";

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certs = await readJsonFile<Certification[]>("certifications.json");
  const cert = certs.find((c) => c.id === id);

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const certs = await readJsonFile<Certification[]>("certifications.json");
  const index = certs.findIndex((c) => c.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  certs[index] = {
    ...certs[index],
    ...body,
    id,
    credentialUrl:
      typeof body.credentialUrl === "string"
        ? normalizeCredentialUrl(body.credentialUrl)
        : certs[index].credentialUrl || "",
    credentialId:
      typeof body.credentialId === "string"
        ? normalizeCredentialId(body.credentialId)
        : normalizeCredentialId(certs[index].credentialId),
    thumbnail:
      typeof body.thumbnail === "string"
        ? normalizeThumbnailPath(body.thumbnail)
        : normalizeThumbnailPath(certs[index].thumbnail),
    paletteCode: sanitizePaletteCode(
      body.paletteCode ?? certs[index].paletteCode,
      body.organization ?? certs[index].organization
    ),
  };
  await writeJsonFile("certifications.json", certs);

  return NextResponse.json(certs[index]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const certs = await readJsonFile<Certification[]>("certifications.json");
  const filtered = certs.filter((c) => c.id !== id);

  if (filtered.length === certs.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await writeJsonFile("certifications.json", filtered);
  return NextResponse.json({ success: true });
}
