"use client";

import React from "react";
import Image from "next/image";
import { PageSectionContent, Service } from "@/lib/types";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SectionHeading from "./SectionHeading";
import { FaCode, FaPaintBrush, FaCloud, FaMobile, FaDatabase, FaShieldAlt } from "react-icons/fa";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  FaCode,
  FaPaintBrush,
  FaCloud,
  FaMobile,
  FaDatabase,
  FaShieldAlt,
};

interface ServicesProps {
  services: Service[];
  sectionContent?: PageSectionContent;
}

const DELIVERY_STEP_TITLE_PREFIX = /^step\s*:/i;

const DEFAULT_DELIVERY_STEPS = [
  {
    title: "Discovery & Planning",
    description:
      "To keep projects focused and predictable, engagements follow a structured three-phase delivery model.",
  },
  {
    title: "Build & Integration",
    description:
      "The solution is developed and integrated with your existing systems while keeping security, governance, and maintainability in focus.",
  },
  {
    title: "Deployment, Training & Handover",
    description:
      "A 14-day post-deployment warranty period is included to address any issues and ensure the system operates smoothly.",
  },
];

const DEFAULT_INTRO =
  "To keep projects focused and predictable, engagements follow a structured three-phase delivery model.";

function isImageIcon(icon: string): boolean {
  const value = icon.trim();
  return value.startsWith("/images/") || /^https?:\/\//i.test(value);
}

export default function Services({ services, sectionContent }: ServicesProps) {
  const sortedServices = [...services].sort((a, b) => a.order - b.order);
  const taggedStepServices = sortedServices
    .filter((service) => DELIVERY_STEP_TITLE_PREFIX.test(service.title.trim()))
    .slice(0, 3);
  const additionalServices = sortedServices.filter(
    (service) => !DELIVERY_STEP_TITLE_PREFIX.test(service.title.trim())
  );
  const configuredSteps = Array.isArray(sectionContent?.steps)
    ? sectionContent.steps
        .map((step) => ({
          title: typeof step?.title === "string" ? step.title.trim() : "",
          description:
            typeof step?.description === "string" ? step.description.trim() : "",
        }))
        .filter((step) => step.title && step.description)
        .slice(0, 3)
    : [];

  const deliverySteps =
    configuredSteps.length > 0
      ? configuredSteps
      : taggedStepServices.length > 0
        ? taggedStepServices.map((service) => ({
            title:
              service.title.replace(DELIVERY_STEP_TITLE_PREFIX, "").trim() ||
              service.title.trim(),
            description: service.description,
          }))
        : DEFAULT_DELIVERY_STEPS;

  const heading =
    typeof sectionContent?.heading === "string" && sectionContent.heading.trim()
      ? sectionContent.heading.trim()
      : "How I Work";
  const intro =
    typeof sectionContent?.intro === "string" && sectionContent.intro.trim()
      ? sectionContent.intro.trim()
      : DEFAULT_INTRO;

  return (
    <section id="services" className="portfolio-section">
      <div className="site-container">
        <SectionHeading overline="PROCESS" title={heading} gradientWord="Work" />
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
          {intro}
        </p>

        <div className="mt-10 space-y-8 md:space-y-10">
          {deliverySteps.map((step, index) => (
            <div
              key={`${step.title}-${index}`}
              className="flex flex-col gap-6 rounded-2xl border border-border-subtle bg-bg-card px-6 py-7 md:px-8 md:py-8"
            >
              <div className="flex items-center gap-4">
                <span className="text-xl font-mono text-accent-purple">{String(index + 1).padStart(2, "0")}/</span>
                <h3 className="text-base font-semibold leading-snug text-text-primary md:text-lg">
                  {step.title}
                </h3>
              </div>

              <div className="bio-content text-sm leading-relaxed text-text-secondary md:text-[0.95rem]">
                {renderDescription(step.description)}
              </div>
            </div>
          ))}
        </div>

        {additionalServices.length > 0 && (
          <div className="mt-14">
            <h3 className="mb-5 text-xs uppercase tracking-[0.2em] text-text-muted">Additional Services</h3>
            <div className="space-y-8 md:space-y-10">
              {additionalServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function renderDescription(text: string): React.ReactNode {
  const blocks = text.split(/\n\n+/);
  return blocks.map((block, i) => {
    const lines = block.split("\n").filter((l) => l.length > 0);
    const isBulletBlock = lines.length > 0 && lines.every((l) => l.trimStart().startsWith("•"));
    if (isBulletBlock) {
      return (
        <ul key={i}>
          {lines.map((line, j) => (
            <li key={j}>{line.replace(/^\s*•\s*/, "")}</li>
          ))}
        </ul>
      );
    }
    return <p key={i}>{lines.map((line, j) => (
      <React.Fragment key={j}>
        {j > 0 && <br />}
        {line}
      </React.Fragment>
    ))}</p>;
  });
}

function ServiceCard({ service }: { service: Service }) {
  const { ref, isVisible } = useScrollReveal(0.2);
  const iconValue = service.icon?.trim() || "";
  const Icon = iconMap[iconValue] || FaCode;
  const hasImageIcon = isImageIcon(iconValue);

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-6 rounded-2xl border border-border-subtle bg-bg-card px-6 py-7 transition-all duration-500 hover:border-accent-purple/40 hover:bg-bg-card-hover/35 md:flex-row md:items-center md:gap-10 md:px-8 md:py-8 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="flex items-center gap-4 md:min-w-[280px] md:max-w-[320px]">
        <span className="text-xl font-mono text-accent-purple">{service.number}</span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-input text-text-secondary">
          {hasImageIcon ? (
            <Image
              src={iconValue}
              alt={`${service.title} icon`}
              width={22}
              height={22}
              className="h-[22px] w-[22px] object-contain"
              unoptimized
            />
          ) : (
            <Icon size={20} />
          )}
        </span>
        <h3 className="text-base font-semibold leading-snug text-text-primary md:text-lg">{service.title}</h3>
      </div>
      <div className="bio-content text-sm leading-relaxed text-text-secondary md:text-[0.95rem]">
        {renderDescription(service.description)}
      </div>
    </div>
  );
}
