import { NextResponse } from "next/server";
import { getProfile } from "@/lib/data";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const CONTENT_TYPE_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
  ico: "image/x-icon",
};

function guessContentType(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
  return CONTENT_TYPE_MAP[ext] || "image/png";
}

async function getDefaultFavicon(): Promise<Buffer> {
  const filePath = join(process.cwd(), "public", "default-favicon.png");
  return readFile(filePath);
}

export async function GET() {
  try {
    const profile = await getProfile();

    if (profile.favicon && profile.favicon.startsWith("http")) {
      const res = await fetch(profile.favicon, { next: { revalidate: 0 } });

      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType =
          res.headers.get("content-type") || guessContentType(profile.favicon);

        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        });
      }
    }

    const fallback = await getDefaultFavicon();
    return new NextResponse(new Uint8Array(fallback), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    try {
      const fallback = await getDefaultFavicon();
      return new NextResponse(new Uint8Array(fallback), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }
}
