import "server-only";

import sanitizeHtml from "sanitize-html";
import { Profile } from "@/lib/types";

const DEFAULT_EXPERIENCE_START_YEAR = 2018;
const DEFAULT_FOCUS = 50;
const DEFAULT_ZOOM = 1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeExperienceStartYear(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? DEFAULT_EXPERIENCE_START_YEAR), 10);
  if (!Number.isFinite(parsed) || parsed < 1900) return DEFAULT_EXPERIENCE_START_YEAR;
  return parsed;
}

function normalizeFocusValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, 0, 100);
}

function normalizeZoomValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, 1, 3);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeStats(
  value: unknown
): {
  label: string;
  value: string;
}[] {
  if (!Array.isArray(value)) return [];

  return value.map((stat) => ({
    label:
      typeof stat === "object" &&
      stat !== null &&
      "label" in stat &&
      typeof stat.label === "string"
        ? stat.label
        : "",
    value:
      typeof stat === "object" &&
      stat !== null &&
      "value" in stat &&
      typeof stat.value === "string"
        ? stat.value
        : "",
  }));
}

function normalizeSocials(
  value: unknown
): {
  platform: string;
  url: string;
  icon: string;
}[] {
  if (!Array.isArray(value)) return [];

  return value.map((social) => ({
    platform:
      typeof social === "object" &&
      social !== null &&
      "platform" in social &&
      typeof social.platform === "string"
        ? social.platform
        : "",
    url:
      typeof social === "object" &&
      social !== null &&
      "url" in social &&
      typeof social.url === "string"
        ? social.url
        : "",
    icon:
      typeof social === "object" &&
      social !== null &&
      "icon" in social &&
      typeof social.icon === "string"
        ? social.icon
        : "FaGlobe",
  }));
}

export function normalizeSkills(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
    .filter(Boolean);
}

export function sanitizeBioHtml(input: unknown): string {
  const raw = typeof input === "string" ? input : "";

  return sanitizeHtml(raw, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  });
}

export function coerceLegacyBioToHtml(input: unknown): string {
  const raw = typeof input === "string" ? input.replace(/\r\n/g, "\n").trim() : "";
  if (!raw) return "";

  const looksLikeHtml = /<\/?[a-z][^>]*>/i.test(raw);
  if (looksLikeHtml) {
    return sanitizeBioHtml(raw);
  }

  const escaped = escapeHtml(raw);
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");

  return sanitizeBioHtml(paragraphs);
}

export function normalizeProfileData(raw: Partial<Profile>): Profile {
  return {
    name: raw.name || "",
    tagline: raw.tagline || "",
    bio: coerceLegacyBioToHtml(raw.bio),
    profilePhoto: raw.profilePhoto || "",
    experienceStartYear: normalizeExperienceStartYear(raw.experienceStartYear),
    profilePhotoFocusX: normalizeFocusValue(raw.profilePhotoFocusX, DEFAULT_FOCUS),
    profilePhotoFocusY: normalizeFocusValue(raw.profilePhotoFocusY, DEFAULT_FOCUS),
    profilePhotoZoom: normalizeZoomValue(raw.profilePhotoZoom, DEFAULT_ZOOM),
    skills: normalizeSkills(raw.skills),
    stats: normalizeStats(raw.stats),
    socials: normalizeSocials(raw.socials),
    email: raw.email || "",
    phone: raw.phone || "",
  };
}
