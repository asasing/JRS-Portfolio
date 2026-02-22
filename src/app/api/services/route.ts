import { NextRequest, NextResponse } from "next/server";
import { getServices, updateServices } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Service } from "@/lib/types";
import { removeImagesIfUnused } from "@/lib/media-cleanup";

export async function GET() {
  const services = await getServices();
  return NextResponse.json(services);
}

export async function PUT(req: NextRequest) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const previous = await getServices();
  const services: Service[] = await req.json();
  const saved = await updateServices(services);

  const previousIcons = previous
    .map((service) => service.icon)
    .filter(
      (icon) =>
        typeof icon === "string" &&
        (icon.includes("/storage/v1/object/public/images/") ||
          icon.startsWith("/images/"))
    );
  void removeImagesIfUnused(previousIcons);

  return NextResponse.json(saved);
}
