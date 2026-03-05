"use client";

import { EngagementModel } from "@/lib/types";

const DEFAULT_MODELS: EngagementModel[] = [
  {
    id: "engagement-model-1",
    title: "Automation Sprint",
    description:
      "Short engagement focused on automating a specific operational workflow or internal system.",
    order: 1,
  },
  {
    id: "engagement-model-2",
    title: "Architecture & Consulting",
    description:
      "System design and planning for organisations modernising internal operations.",
    order: 2,
  },
  {
    id: "engagement-model-3",
    title: "Ongoing Automation Partner",
    description:
      "Continuous system improvements, automation expansion, and optimisation support.",
    order: 3,
  },
];

interface EngagementModelsProps {
  models?: EngagementModel[];
}

export default function EngagementModels({ models = [] }: EngagementModelsProps) {
  const displayModels = models.length > 0
    ? [...models].sort((a, b) => a.order - b.order)
    : DEFAULT_MODELS;

  return (
    <section id="engagement-models" className="portfolio-section">
      <div className="site-container">
        <div className="mb-8 md:mb-10">
          <h3 className="text-xs uppercase tracking-[0.3em] text-text-muted flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-accent-purple" />
            ENGAGEMENT MODELS
          </h3>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            How Organisations Typically Work With Me
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayModels.map((model, index) => (
            <article
              key={model.id}
              className="rounded-2xl border border-border-subtle bg-bg-card px-6 py-7 md:px-7 md:py-8"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">
                Option 0{index + 1}
              </p>
              <h3 className="text-lg font-semibold text-text-primary mb-3">{model.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{model.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
