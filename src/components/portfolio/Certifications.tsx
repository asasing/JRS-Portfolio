"use client";

import { Certification } from "@/lib/types";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SectionHeading from "./SectionHeading";
import Badge from "@/components/ui/Badge";

interface CertificationsProps {
  certifications: Certification[];
}

export default function Certifications({ certifications }: CertificationsProps) {
  return (
    <section id="certifications" className="portfolio-section">
      <div className="site-container">
        <SectionHeading overline="ACHIEVEMENTS" title="Certifications" gradientWord="Certifications" />

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certifications
            .sort((a, b) => a.order - b.order)
            .map((cert) => (
              <CertCard key={cert.id} cert={cert} />
            ))}
        </div>
      </div>
    </section>
  );
}

function CertCard({ cert }: { cert: Certification }) {
  const { ref, isVisible } = useScrollReveal(0.1);
  const credentialUrl = (cert.credentialUrl || "").trim();
  const hasCredentialLink = credentialUrl !== "" && credentialUrl !== "#";
  const credentialHref = /^https?:\/\//i.test(credentialUrl)
    ? credentialUrl
    : `https://${credentialUrl}`;

  const cardBody = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-text-primary leading-snug">{cert.name}</h3>
        <Badge color={cert.badgeColor} className="shrink-0">{cert.year}</Badge>
      </div>
      <p className="text-sm text-accent-purple mb-2">{cert.organization}</p>
      <p className="text-sm text-text-secondary leading-relaxed flex-1">{cert.description}</p>
      {hasCredentialLink && (
        <span className="inline-block mt-3 text-sm text-accent-purple group-hover:text-accent-magenta transition-colors">
          View Credential {"->"}
        </span>
      )}
    </>
  );

  return (
    <div
      ref={ref}
      className={`group flex h-full flex-col rounded-2xl border border-border-subtle bg-bg-card p-6 transition-all duration-500 hover:bg-bg-card-hover/35 ${
        hasCredentialLink ? "hover:border-accent-purple/50" : "hover:border-accent-purple/30"
      } ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {hasCredentialLink ? (
        <a
          href={credentialHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full cursor-pointer"
          aria-label={`Open credential for ${cert.name}`}
        >
          {cardBody}
        </a>
      ) : (
        cardBody
      )}
    </div>
  );
}
