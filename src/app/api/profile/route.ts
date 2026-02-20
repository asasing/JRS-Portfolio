import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Profile } from "@/lib/types";
import { normalizeProfileData } from "@/lib/profile-normalizers";

export async function GET() {
  const profile = await readJsonFile<Partial<Profile>>("profile.json");
  return NextResponse.json(normalizeProfileData(profile));
}

export async function PUT(req: NextRequest) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const current = await readJsonFile<Partial<Profile>>("profile.json");
  const incoming = (await req.json()) as Partial<Profile>;
  const profile = normalizeProfileData({ ...current, ...incoming });

  await writeJsonFile("profile.json", profile);
  return NextResponse.json(profile);
}
