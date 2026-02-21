"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Certification } from "@/lib/types";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import SectionHeading from "./SectionHeading";
import Modal from "@/components/ui/Modal";
import {
  CERT_PROVIDER_PALETTES,
  sanitizePaletteCode,
} from "@/lib/certification-palettes";

interface CertificationsProps {
  certifications: Certification[];
}

export default function Certifications({ certifications }: CertificationsProps) {
  const sortedCertifications = [...certifications].sort((a, b) => a.order - b.order);

  return (
    <section id="certifications" className="portfolio-section">
      <div className="site-container">
        <SectionHeading overline="ACHIEVEMENTS" title="Certifications" gradientWord="Certifications" />

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCertifications.map((cert) => (
            <CertCard key={cert.id} cert={cert} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CertCard({ cert }: { cert: Certification }) {
  const { ref, isVisible } = useScrollReveal(0.1);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const credentialUrl = (cert.credentialUrl || "").trim();
  const credentialId = (cert.credentialId || "").trim();
  const thumbnail = (cert.thumbnail || "").trim();
  const hasCredentialLink = credentialUrl !== "" && credentialUrl !== "#";
  const hasThumbnail = thumbnail !== "";
  const credentialHref = /^https?:\/\//i.test(credentialUrl)
    ? credentialUrl
    : `https://${credentialUrl}`;

  const paletteCode = sanitizePaletteCode(cert.paletteCode, cert.organization);
  const palette = CERT_PROVIDER_PALETTES[paletteCode];
  const cardHoverClass = useMemo(
    () => (hasCredentialLink ? "hover:border-accent-purple/50" : "hover:border-accent-purple/30"),
    [hasCredentialLink]
  );

  const cardBody = (
    <>
      {hasThumbnail && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setShowImagePreview(true);
          }}
          className="mb-4 relative h-44 w-full overflow-hidden rounded-xl border border-border-subtle bg-bg-primary cursor-zoom-in"
          aria-label={`Preview certification image for ${cert.name}`}
        >
          <Image
            src={thumbnail}
            alt={`${cert.name} thumbnail`}
            fill
            className="object-contain transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </button>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-text-primary leading-snug">{cert.name}</h3>
        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full shrink-0 text-text-secondary bg-bg-input border border-border-subtle">
          {cert.year}
        </span>
      </div>

      <p className="text-sm mb-2" style={{ color: palette.textColor }}>
        {cert.organization}
      </p>

      {credentialId && (
        <p className="text-xs text-text-muted mb-2">
          Credential ID: <span className="text-text-secondary">{credentialId}</span>
        </p>
      )}

      <p className="text-sm text-text-secondary leading-relaxed flex-1">{cert.description}</p>

      {hasCredentialLink && (
        <a
          href={credentialHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm transition-colors hover:opacity-90"
          style={{ color: palette.textColor }}
          aria-label={`Open credential for ${cert.name}`}
        >
          View Credential {"->"}
        </a>
      )}
    </>
  );

  return (
    <>
      <div
        ref={ref}
        className={`group flex h-full flex-col rounded-2xl border border-border-subtle bg-bg-card p-6 transition-all duration-500 hover:bg-bg-card-hover/35 ${cardHoverClass} ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
        style={{ boxShadow: `inset 0 0 0 1px ${palette.borderTint}` }}
      >
        {cardBody}
      </div>

      {hasThumbnail && showImagePreview && (
        <Modal isOpen={showImagePreview} onClose={() => setShowImagePreview(false)}>
          <div className="p-4 md:p-6">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border-subtle bg-bg-primary">
              <Image
                src={thumbnail}
                alt={`${cert.name} full preview`}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
