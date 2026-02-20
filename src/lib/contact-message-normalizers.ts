import "server-only";

import sanitizeHtml from "sanitize-html";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeCommonEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeTextWhitespace(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function plainTextToHtml(input: string): string {
  const raw = normalizeTextWhitespace(input);
  if (!raw) return "";

  const escaped = escapeHtml(raw);
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function sanitizeContactMessageHtml(input: unknown): string {
  const raw = typeof input === "string" ? input : "";

  return sanitizeHtml(raw, {
    allowedTags: ["p", "br", "strong", "em", "u", "ul", "ol", "li", "a"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  });
}

export function contactMessageHtmlToText(input: string): string {
  const withBreaks = input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/(p|div|ul|ol|blockquote|h[1-6])>/gi, "\n");

  const stripped = sanitizeHtml(withBreaks, {
    allowedTags: [],
    allowedAttributes: {},
  });

  return normalizeTextWhitespace(decodeCommonEntities(stripped));
}

export function normalizeContactMessage(
  inputHtml: unknown,
  inputText: unknown
): { html: string; text: string } {
  const sanitizedHtml = sanitizeContactMessageHtml(inputHtml);
  const htmlText = contactMessageHtmlToText(sanitizedHtml);

  if (htmlText) {
    return { html: sanitizedHtml, text: htmlText };
  }

  const legacyText = typeof inputText === "string" ? normalizeTextWhitespace(inputText) : "";
  if (!legacyText) {
    return { html: "", text: "" };
  }

  const fallbackHtml = sanitizeContactMessageHtml(plainTextToHtml(legacyText));
  const fallbackText = contactMessageHtmlToText(fallbackHtml);
  return { html: fallbackHtml, text: fallbackText };
}
