export const CERT_PROVIDER_PALETTES = {
  "provider-blue": { textColor: "#3b82f6", bgTint: "#3b82f620", borderTint: "#3b82f655" },
  "provider-cyan": { textColor: "#06b6d4", bgTint: "#06b6d420", borderTint: "#06b6d455" },
  "provider-green": { textColor: "#22c55e", bgTint: "#22c55e20", borderTint: "#22c55e55" },
  "provider-emerald": { textColor: "#10b981", bgTint: "#10b98120", borderTint: "#10b98155" },
  "provider-amber": { textColor: "#f59e0b", bgTint: "#f59e0b20", borderTint: "#f59e0b55" },
  "provider-orange": { textColor: "#f97316", bgTint: "#f9731620", borderTint: "#f9731655" },
  "provider-red": { textColor: "#ef4444", bgTint: "#ef444420", borderTint: "#ef444455" },
  "provider-rose": { textColor: "#f43f5e", bgTint: "#f43f5e20", borderTint: "#f43f5e55" },
  "provider-violet": { textColor: "#8b5cf6", bgTint: "#8b5cf620", borderTint: "#8b5cf655" },
  "provider-slate": { textColor: "#94a3b8", bgTint: "#94a3b820", borderTint: "#94a3b855" },
} as const;

export type CertificationPaletteCode = keyof typeof CERT_PROVIDER_PALETTES;

const PROVIDER_KEYWORD_MAP: Array<{ keywords: string[]; paletteCode: CertificationPaletteCode }> = [
  { keywords: ["microsoft"], paletteCode: "provider-cyan" },
  { keywords: ["automation anywhere"], paletteCode: "provider-orange" },
  { keywords: ["accenture"], paletteCode: "provider-violet" },
  {
    keywords: ["international scrum institute", "scrum institute", "scrum institute™"],
    paletteCode: "provider-amber",
  },
  { keywords: ["certiprof"], paletteCode: "provider-green" },
];

export const CERTIFICATION_PALETTE_CODES = Object.keys(
  CERT_PROVIDER_PALETTES
) as CertificationPaletteCode[];

export function normalizeProviderName(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function resolvePaletteCodeFromProvider(organization: unknown): CertificationPaletteCode {
  const provider = normalizeProviderName(organization);
  if (!provider) return "provider-slate";

  const match = PROVIDER_KEYWORD_MAP.find((item) =>
    item.keywords.some((keyword) => provider.includes(keyword))
  );

  return match?.paletteCode || "provider-slate";
}

export function sanitizePaletteCode(
  paletteCode: unknown,
  organization: unknown
): CertificationPaletteCode {
  if (typeof paletteCode === "string") {
    const trimmed = paletteCode.trim() as CertificationPaletteCode;
    if (CERTIFICATION_PALETTE_CODES.includes(trimmed)) {
      return trimmed;
    }
  }

  return resolvePaletteCodeFromProvider(organization);
}
