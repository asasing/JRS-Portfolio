"use client";

interface TechnologiesPlatformsProps {
  skills: string[];
}

export default function TechnologiesPlatforms({ skills }: TechnologiesPlatformsProps) {
  const items = skills.filter((skill) => skill.trim().length > 0);

  if (items.length === 0) return null;

  return (
    <section id="technologies" className="portfolio-section">
      <div className="site-container">
        <div className="mb-8 md:mb-10">
          <h3 className="text-xs uppercase tracking-[0.3em] text-text-muted flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-accent-purple" />
            TECHNOLOGIES
          </h3>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Technologies & Platforms
          </h2>
          <p className="mt-3 text-sm text-text-secondary max-w-3xl">
            Platform stack used to deliver secure, reliable, and scalable business systems.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {items.map((skill) => (
            <span
              key={skill}
              className="pill-button border border-border-subtle text-sm text-text-secondary"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
