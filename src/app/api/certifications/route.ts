import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Certification } from "@/lib/types";
import crypto from "crypto";

function normalizeCredentialUrl(url: unknown): string {
  if (typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

export async function GET() {
  const certs = await readJsonFile<Certification[]>("certifications.json");
  return NextResponse.json(certs);
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
    badgeColor: body.badgeColor || "#8b5cf6",
    order: body.order ?? certs.length + 1,
  };

  certs.push(newCert);
  await writeJsonFile("certifications.json", certs);

  return NextResponse.json(newCert, { status: 201 });
}
