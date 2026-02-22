/**
 * One-time migration script: seeds Supabase tables from local JSON files
 * and uploads local images to Supabase Storage.
 *
 * Prerequisites:
 *   1. Run scripts/supabase-migration.sql in Supabase Dashboard SQL Editor
 *   2. Ensure .env has NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *      SUPABASE_SERVICE_ROLE_KEY set
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DATA_DIR = path.join(process.cwd(), "data");
const PUBLIC_DIR = path.join(process.cwd(), "public");

function storagePublicUrl(bucketPath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/images/${bucketPath}`;
}

// ---------------------------------------------------------------------------
// Image upload helpers
// ---------------------------------------------------------------------------

const uploadedPaths = new Map<string, string>();

async function uploadImage(localPath: string): Promise<string> {
  if (!localPath || !localPath.startsWith("/images/")) return localPath;

  if (uploadedPaths.has(localPath)) return uploadedPaths.get(localPath)!;

  const fsPath = path.join(PUBLIC_DIR, localPath.replace(/^\//, ""));

  try {
    await fs.access(fsPath);
  } catch {
    console.warn(`  [skip] File not found: ${fsPath}`);
    return localPath;
  }

  const buffer = await fs.readFile(fsPath);
  const storagePath = localPath.replace(/^\/images\//, "");

  const ext = path.extname(fsPath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  const contentType = mimeMap[ext] || "application/octet-stream";

  const { error } = await supabase.storage
    .from("images")
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) {
    console.warn(`  [error] Upload failed for ${storagePath}: ${error.message}`);
    return localPath;
  }

  const publicUrl = storagePublicUrl(storagePath);
  uploadedPaths.set(localPath, publicUrl);
  console.log(`  [ok] ${localPath} → ${storagePath}`);
  return publicUrl;
}

async function uploadImagesInHtml(html: string): Promise<string> {
  const regex = /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;
  let result = html;
  let match: RegExpExecArray | null;

  const replacements: [string, string][] = [];
  while ((match = regex.exec(html)) !== null) {
    const src = match[2];
    if (src.startsWith("/images/")) {
      const newUrl = await uploadImage(src);
      if (newUrl !== src) {
        replacements.push([src, newUrl]);
      }
    }
  }

  for (const [oldSrc, newSrc] of replacements) {
    result = result.replaceAll(oldSrc, newSrc);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Data loaders
// ---------------------------------------------------------------------------

async function readJson<T>(filename: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
  return JSON.parse(raw) as T;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

async function migrateProfile() {
  console.log("\n--- Migrating profile ---");
  const p = await readJson<Record<string, unknown>>("profile.json");

  const profilePhoto = await uploadImage(
    (p.profilePhoto as string) || ""
  );
  const favicon = await uploadImage((p.favicon as string) || "");
  const bio = await uploadImagesInHtml((p.bio as string) || "");

  const { error } = await supabase.from("profile").upsert({
    id: "default",
    name: p.name || "",
    tagline: p.tagline || "",
    bio,
    profile_photo: profilePhoto,
    experience_start_year: p.experienceStartYear ?? 2018,
    profile_photo_focus_x: p.profilePhotoFocusX ?? 50,
    profile_photo_focus_y: p.profilePhotoFocusY ?? 50,
    profile_photo_zoom: p.profilePhotoZoom ?? 1,
    skills: p.skills ?? [],
    stats: p.stats ?? [],
    socials: p.socials ?? [],
    email: p.email || "",
    phone: p.phone || "",
    favicon,
  });

  if (error) console.error("Profile upsert error:", error.message);
  else console.log("Profile migrated.");
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

async function migrateProjects() {
  console.log("\n--- Migrating projects ---");
  const projects = await readJson<Record<string, unknown>[]>("projects.json");

  for (const p of projects) {
    const thumbnail = await uploadImage((p.thumbnail as string) || "");
    const gallery: string[] = [];
    for (const img of (p.gallery as string[]) || []) {
      gallery.push(await uploadImage(img));
    }
    const description = await uploadImagesInHtml(
      (p.description as string) || ""
    );

    const { error } = await supabase.from("projects").upsert({
      id: p.id,
      title: p.title || "",
      category: p.category || "",
      categories: p.categories ?? [],
      description,
      thumbnail,
      thumbnail_focus_x: p.thumbnailFocusX ?? 50,
      thumbnail_focus_y: p.thumbnailFocusY ?? 50,
      thumbnail_zoom: p.thumbnailZoom ?? 1,
      gallery,
      attachments: p.attachments ?? [],
      links: p.links ?? [],
      sort_order: p.order ?? 0,
    });

    if (error) console.error(`Project ${p.id} error:`, error.message);
    else console.log(`Project ${p.id} migrated.`);
  }
}

// ---------------------------------------------------------------------------
// Project Categories
// ---------------------------------------------------------------------------

async function migrateCategories() {
  console.log("\n--- Migrating project categories ---");
  let categories: Record<string, unknown>[] = [];

  try {
    categories = await readJson<Record<string, unknown>[]>(
      "project-categories.json"
    );
  } catch {
    console.log("No project-categories.json found, skipping.");
    return;
  }

  for (const c of categories) {
    const { error } = await supabase.from("project_categories").upsert({
      id: c.id,
      label: c.label || "",
      sort_order: c.order ?? 0,
    });

    if (error) console.error(`Category ${c.id} error:`, error.message);
    else console.log(`Category ${c.id} migrated.`);
  }
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

async function migrateServices() {
  console.log("\n--- Migrating services ---");
  const services = await readJson<Record<string, unknown>[]>("services.json");

  for (const s of services) {
    const icon = await uploadImage((s.icon as string) || "");

    const { error } = await supabase.from("services").upsert({
      id: s.id,
      number: s.number || "",
      title: s.title || "",
      description: s.description || "",
      icon,
      sort_order: s.order ?? 0,
    });

    if (error) console.error(`Service ${s.id} error:`, error.message);
    else console.log(`Service ${s.id} migrated.`);
  }
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

async function migrateCertifications() {
  console.log("\n--- Migrating certifications ---");
  const certs = await readJson<Record<string, unknown>[]>(
    "certifications.json"
  );

  for (const c of certs) {
    const thumbnail = await uploadImage((c.thumbnail as string) || "");

    const { error } = await supabase.from("certifications").upsert({
      id: c.id,
      name: c.name || "",
      year: c.year || "",
      organization: c.organization || "",
      description: c.description || "",
      credential_url: c.credentialUrl || "",
      credential_id: c.credentialId || "",
      thumbnail,
      attachments: c.attachments ?? [],
      palette_code: c.paletteCode || "",
      badge_color: c.badgeColor || "#8b5cf6",
      sort_order: c.order ?? 0,
    });

    if (error) console.error(`Cert ${c.id} error:`, error.message);
    else console.log(`Cert ${c.id} migrated.`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Starting Supabase migration...");
  console.log(`URL: ${SUPABASE_URL}`);

  await migrateProfile();
  await migrateProjects();
  await migrateCategories();
  await migrateServices();
  await migrateCertifications();

  console.log(`\n✓ Migration complete. ${uploadedPaths.size} images uploaded.`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
