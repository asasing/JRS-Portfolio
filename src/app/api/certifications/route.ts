import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Certification } from "@/lib/types";
import crypto from "crypto";
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

export async function GET() {
  const certs = await readJsonFile<Certification[]>("certifications.json");
  const normalized = certs.map((cert) => ({
    ...cert,
    credentialId: normalizeCredentialId(cert.credentialId),
    thumbnail: normalizeThumbnailPath(cert.thumbnail),
    paletteCode: sanitizePaletteCode(cert.paletteCode, cert.organization),
  }));
  return NextResponse.json(normalized);
}

export async function POST(req: NextRequest) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const certs = await readJsonFile<Certification[]>("certifications.json");

  const newCert: Certification = {
    id: `cert-${crypto.randomUUID().slice(0, 8)}`,
    name: body.name || "",
    year: body.year || "",
    organization: body.organization || "",
    description: body.description || "",
    credentialUrl: normalizeCredentialUrl(body.credentialUrl),
    credentialId: normalizeCredentialId(body.credentialId),
    thumbnail: normalizeThumbnailPath(body.thumbnail),
    paletteCode: sanitizePaletteCode(body.paletteCode, body.organization),
    badgeColor: body.badgeColor || "#8b5cf6",
    order: body.order ?? certs.length + 1,
  };

  certs.push(newCert);
  await writeJsonFile("certifications.json", certs);

  return NextResponse.json(newCert, { status: 201 });
}
