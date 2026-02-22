import { NextRequest, NextResponse } from "next/server";
import { getProfile, updateProfile } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Profile } from "@/lib/types";
import { normalizeProfileData } from "@/lib/profile-normalizers";
import { removeImagesIfUnused } from "@/lib/media-cleanup";

export async function GET() {
  const profile = await getProfile();
  return NextResponse.json(normalizeProfileData(profile));
}

export async function PUT(req: NextRequest) {
  if (!(await authenticateRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const current = await getProfile();
  const incoming = (await req.json()) as Partial<Profile>;
  const profile = normalizeProfileData({ ...current, ...incoming });

  const saved = await updateProfile(profile);

  const oldImages: string[] = [];
  if (current.profilePhoto && current.profilePhoto !== profile.profilePhoto) {
    oldImages.push(current.profilePhoto);
  }
  if (current.favicon && current.favicon !== profile.favicon) {
    oldImages.push(current.favicon);
  }
  if (oldImages.length > 0) {
    void removeImagesIfUnused(oldImages);
  }

  return NextResponse.json(saved);
}
