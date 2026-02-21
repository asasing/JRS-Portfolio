import "server-only";

import fs from "fs/promises";
import path from "path";
import { readJsonFile } from "@/lib/data";
import { Certification, Profile, Project, Service } from "@/lib/types";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const IMAGE_ROOT_DIR = path.join(PUBLIC_DIR, "images");

const PROTECTED_IMAGE_PATHS = new Set<string>([
  "/images/projects/placeholder-1.svg",
  "/images/projects/placeholder-2.svg",
  "/images/projects/placeholder-3.svg",
  "/images/profile/photo.svg",
]);

function isPublicImagePath(value: unknown): value is string {
  return typeof value === "string" && value.trim().startsWith("/images/");
}

function normalizeImagePath(value: unknown): string {
  if (!isPublicImagePath(value)) return "";
  return value.trim();
}

function extractImageSrcsFromHtml(html: unknown): string[] {
  if (typeof html !== "string" || !html) return [];

  const results: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null = regex.exec(html);

  while (match) {
    const src = normalizeImagePath(match[1]);
    if (src) results.push(src);
    match = regex.exec(html);
  }

  return results;
}

function projectImagePaths(project: Project): string[] {
  const paths: string[] = [];
  const thumb = normalizeImagePath(project.thumbnail);
  if (thumb) paths.push(thumb);

  if (Array.isArray(project.gallery)) {
    for (const item of project.gallery) {
      const image = normalizeImagePath(item);
      if (image) paths.push(image);
    }
  }

  paths.push(...extractImageSrcsFromHtml(project.description));
  return paths;
}

async function getReferencedImagePaths(): Promise<Set<string>> {
  const refs = new Set<string>();

  const [profile, projects, certifications, services] = await Promise.all([
    readJsonFile<Partial<Profile>>("profile.json"),
    readJsonFile<Project[]>("projects.json"),
    readJsonFile<Certification[]>("certifications.json"),
    readJsonFile<Service[]>("services.json"),
  ]);

  const profilePhoto = normalizeImagePath(profile.profilePhoto);
  if (profilePhoto) refs.add(profilePhoto);

  for (const image of extractImageSrcsFromHtml(profile.bio)) {
    refs.add(image);
  }

  for (const project of projects) {
    for (const image of projectImagePaths(project)) {
      refs.add(image);
    }
  }

  for (const cert of certifications) {
    const image = normalizeImagePath(cert.thumbnail);
    if (image) refs.add(image);
  }

  for (const service of services) {
    const image = normalizeImagePath(service.icon);
    if (image) refs.add(image);
  }

  return refs;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function publicPathToFsPath(imagePath: string): string {
  return path.join(PUBLIC_DIR, imagePath.replace(/^\//, ""));
}

async function listImageFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const paths: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      paths.push(...(await listImageFiles(full)));
      continue;
    }
    if (!entry.isFile()) continue;

    const rel = full.slice(PUBLIC_DIR.length).replace(/\\/g, "/");
    paths.push(rel.startsWith("/") ? rel : `/${rel}`);
  }

  return paths;
}

export async function removeImagesIfUnused(candidates: string[]): Promise<string[]> {
  const normalizedCandidates = Array.from(
    new Set(
      candidates
        .map((candidate) => normalizeImagePath(candidate))
        .filter((candidate) => candidate && !PROTECTED_IMAGE_PATHS.has(candidate))
    )
  );

  if (normalizedCandidates.length === 0) return [];

  const refs = await getReferencedImagePaths();
  const deleted: string[] = [];

  for (const imagePath of normalizedCandidates) {
    if (refs.has(imagePath)) continue;

    const fsPath = publicPathToFsPath(imagePath);
    if (!(await fileExists(fsPath))) continue;

    await fs.unlink(fsPath);
    deleted.push(imagePath);
  }

  return deleted;
}

export async function cleanupAllUnusedImages(): Promise<string[]> {
  if (!(await fileExists(IMAGE_ROOT_DIR))) return [];

  const [allImages, refs] = await Promise.all([
    listImageFiles(IMAGE_ROOT_DIR),
    getReferencedImagePaths(),
  ]);

  const orphaned = allImages.filter(
    (imagePath) => !refs.has(imagePath) && !PROTECTED_IMAGE_PATHS.has(imagePath)
  );

  return removeImagesIfUnused(orphaned);
}
