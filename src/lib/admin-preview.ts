import { Attachment, Certification, Project } from "@/lib/types";

function isSafeUrl(value: string): boolean {
  const lower = value.toLowerCase();
  return !lower.startsWith("javascript:") && !lower.startsWith("data:text/html");
}

export function normalizeUrlForOpen(url: string): string {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return "";
  if (!isSafeUrl(trimmed)) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }

  return unique;
}

function normalizeAttachments(input: unknown): Attachment[] {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  const attachments: Attachment[] = [];

  for (const item of input) {
    if (typeof item !== "object" || item === null) continue;

    const url =
      typeof (item as Attachment).url === "string"
        ? (item as Attachment).url.trim()
        : "";
    if (!url || !isSafeUrl(url)) continue;

    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const label =
      typeof (item as Attachment).label === "string"
        ? (item as Attachment).label.trim()
        : "";
    const mimeType =
      (item as Attachment).mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      (item as Attachment).mimeType === "application/pdf"
        ? (item as Attachment).mimeType
        : "application/pdf";

    attachments.push({
      id:
        typeof (item as Attachment).id === "string" && (item as Attachment).id.trim()
          ? (item as Attachment).id.trim()
          : `att-${attachments.length + 1}`,
      label,
      url,
      mimeType,
    });
  }

  return attachments;
}

export function collectProjectImagePreviews(
  project: Pick<Project, "thumbnail" | "gallery">
): string[] {
  const values: string[] = [];
  if (typeof project.thumbnail === "string") values.push(project.thumbnail);
  if (Array.isArray(project.gallery)) values.push(...project.gallery);
  return dedupeStrings(values);
}

export function collectProjectFilePreviews(project: Pick<Project, "attachments">): Attachment[] {
  return normalizeAttachments(project.attachments);
}

export function collectProjectLinkPreviews(
  project: Pick<Project, "links">
): { label: string; url: string }[] {
  if (!Array.isArray(project.links)) return [];

  const links: { label: string; url: string }[] = [];
  const seen = new Set<string>();

  for (const item of project.links) {
    if (typeof item !== "object" || item === null) continue;
    const url = normalizeUrlForOpen(typeof item.url === "string" ? item.url : "");
    if (!url) continue;
    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const label = typeof item.label === "string" ? item.label.trim() : "";
    links.push({ label, url });
  }

  return links;
}

export function collectCertificationImagePreview(
  cert: Pick<Certification, "thumbnail">
): string | null {
  const thumbnail = typeof cert.thumbnail === "string" ? cert.thumbnail.trim() : "";
  return thumbnail || null;
}

export function collectCertificationFilePreviews(
  cert: Pick<Certification, "attachments">
): Attachment[] {
  return normalizeAttachments(cert.attachments);
}

export function collectCertificationLinkPreview(
  cert: Pick<Certification, "credentialUrl">
): string | null {
  const link = normalizeUrlForOpen(typeof cert.credentialUrl === "string" ? cert.credentialUrl : "");
  return link || null;
}
