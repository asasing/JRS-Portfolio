import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/data";
import { authenticateRequest } from "@/lib/api-auth";
import { Service } from "@/lib/types";
import { removeImagesIfUnused } from "@/lib/media-cleanup";

export async function GET() {
  const services = await readJsonFile<Service[]>("services.json");
  return NextResponse.json(services);
}

export async function PUT(req: NextRequest) {
  if (!(await authenticateRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const previous = await readJsonFile<Service[]>("services.json");
  const services: Service[] = await req.json();
  await writeJsonFile("services.json", services);

  const previousIcons = previous
    .map((service) => service.icon)
    .filter((icon) => typeof icon === "string" && icon.trim().startsWith("/images/"));
  void removeImagesIfUnused(previousIcons);

  return NextResponse.json(services);
}
