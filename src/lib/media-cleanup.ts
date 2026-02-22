import "server-only";

import { supabaseAdmin, extractStoragePath } from "@/lib/supabase";
import {
  getProfile,
  getProjects,
  getCertifications,
  getServices,
} from "@/lib/data";

function isImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  return (
    value.includes("/storage/v1/object/public/images/") ||
    value.startsWith("/images/")
  );
}

function extractImageSrcsFromHtml(html: unknown): string[] {
  if (typeof html !== "string" || !html) return [];

  const results: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null = regex.exec(html);

  while (match) {
    if (match[1]) results.push(match[1]);
    match = regex.exec(html);
  }

  return results;
}

async function getReferencedStoragePaths(): Promise<Set<string>> {
  const refs = new Set<string>();

  const [profile, projects, certifications, services] = await Promise.all([
    getProfile(),
    getProjects(),
    getCertifications(),
    getServices(),
  ]);

  const addRef = (url: string) => {
    const p = extractStoragePath(url);
    if (p) refs.add(p);
  };

  if (isImageUrl(profile.profilePhoto)) addRef(profile.profilePhoto);
  if (isImageUrl(profile.favicon)) addRef(profile.favicon);
  for (const src of extractImageSrcsFromHtml(profile.bio)) addRef(src);

  for (const project of projects) {
    if (isImageUrl(project.thumbnail)) addRef(project.thumbnail);
    for (const img of project.gallery ?? []) {
      if (isImageUrl(img)) addRef(img);
    }
    for (const src of extractImageSrcsFromHtml(project.description)) {
      addRef(src);
    }
  }

  for (const cert of certifications) {
    if (isImageUrl(cert.thumbnail)) addRef(cert.thumbnail);
  }

  for (const service of services) {
    if (isImageUrl(service.icon)) addRef(service.icon);
  }

  return refs;
}

export async function removeImagesIfUnused(
  candidates: string[]
): Promise<string[]> {
  const paths = candidates
    .map((c) => extractStoragePath(c))
    .filter((p): p is string => !!p);

  if (paths.length === 0) return [];

  const refs = await getReferencedStoragePaths();
  const toDelete = paths.filter((p) => !refs.has(p));

  if (toDelete.length === 0) return [];

  const { error } = await supabaseAdmin.storage
    .from("images")
    .remove(toDelete);

  if (error) {
    console.error("Failed to remove images from storage:", error);
    return [];
  }

  return toDelete;
}

export async function cleanupAllUnusedImages(): Promise<string[]> {
  const refs = await getReferencedStoragePaths();

  const allFiles: string[] = [];
  const folders = ["profile", "projects", "services", "certifications"];

  for (const folder of folders) {
    const { data } = await supabaseAdmin.storage.from("images").list(folder);
    if (data) {
      for (const file of data) {
        if (file.name) allFiles.push(`${folder}/${file.name}`);
      }
    }
  }

  const orphaned = allFiles.filter((p) => !refs.has(p));
  if (orphaned.length === 0) return [];

  const { error } = await supabaseAdmin.storage
    .from("images")
    .remove(orphaned);

  if (error) {
    console.error("Failed to cleanup images:", error);
    return [];
  }

  return orphaned;
}
