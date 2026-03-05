"use client";

interface CustomSectionProps {
  id: string;
  title?: string;
  bodyHtml?: string;
}

export default function CustomSection({ id, title, bodyHtml }: CustomSectionProps) {
  if (!title?.trim() && !bodyHtml?.trim()) {
    return null;
  }

  return (
    <section id={`custom-${id}`} className="portfolio-section">
      <div className="site-container">
        <div className="rounded-2xl border border-border-subtle bg-bg-card px-6 py-7 md:px-8 md:py-8">
          {title?.trim() && (
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              {title}
            </h2>
          )}
          {bodyHtml?.trim() && (
            <div
              className="bio-content mt-5 text-sm leading-relaxed text-text-secondary md:text-base"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
