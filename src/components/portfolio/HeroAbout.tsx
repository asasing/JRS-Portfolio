"use client";

import { Profile } from "@/lib/types";
import GlowPhoto from "./GlowPhoto";
import StatsCounter from "./StatsCounter";
import { FaLinkedinIn, FaGithub, FaEnvelope, FaTwitter } from "react-icons/fa";
import Button from "@/components/ui/Button";
import { CALENDLY_URL } from "@/lib/constants";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  FaLinkedinIn,
  FaGithub,
  FaEnvelope,
  FaTwitter,
};

interface HeroAboutProps {
  profile: Profile;
}

const HERO_HEADLINE =
  "I help organisations eliminate manual processes and fragmented systems by building scalable internal platforms using Microsoft Power Platform, Azure, and modern automation tools.";

const HERO_SUPPORTING_LINE =
  "From workflow automation to internal business systems, I design solutions that reduce operational friction while remaining secure, scalable, and maintainable.";

const DEFAULT_ABOUT_HTML = `
  <p>I design and deliver secure, scalable business systems that streamline operations and reduce manual workload.</p>
  <p>Using the Microsoft ecosystem (Power Platform, Azure) alongside modern development tools and AI-driven automation, I help organisations replace fragmented spreadsheets and legacy workflows with structured, governed systems built for long-term reliability.</p>
  <p>My work typically focuses on:</p>
  <ul>
    <li>operational workflow automation</li>
    <li>internal business applications and portals</li>
    <li>CRM and data platform modernization</li>
    <li>integrations between business systems and APIs</li>
    <li>AI-assisted automation and decision workflows</li>
  </ul>
  <p>From discovery to deployment, I take ownership of the solution lifecycle - ensuring systems are practical, maintainable, and aligned with real business outcomes.</p>
`;

export default function HeroAbout({ profile }: HeroAboutProps) {
  const currentYear = new Date().getFullYear();
  const startYear = Number.isFinite(profile.experienceStartYear)
    ? profile.experienceStartYear
    : 2018;
  const yearsOfExperience = Math.max(currentYear - startYear, 0);
  const experienceValue = `${yearsOfExperience}+`;
  const hasExperienceStat = profile.stats.some(
    (stat) => stat.label.trim().toLowerCase() === "years of experience"
  );

  const displayStats = hasExperienceStat
    ? profile.stats.map((stat) =>
        stat.label.trim().toLowerCase() === "years of experience"
          ? { ...stat, value: experienceValue }
          : stat
      )
    : [{ label: "Years of Experience", value: experienceValue }, ...profile.stats];
  const aboutHtml = profile.bio?.trim() ? profile.bio : DEFAULT_ABOUT_HTML;
  const heroHeadline = profile.heroHeadline?.trim() || HERO_HEADLINE;
  const heroSupportingLine =
    profile.heroSupportingLine?.trim() || HERO_SUPPORTING_LINE;

  return (
    <section id="about" className="min-h-screen flex items-center pt-20">
      <div className="site-container">
        <div className="mx-auto mb-12 max-w-5xl space-y-5 text-center">
          <h1
            className="text-text-primary text-[18px] leading-relaxed font-semibold"
            style={{
              backgroundClip: "unset",
              WebkitBackgroundClip: "unset",
              color: "rgba(255, 255, 255, 1)",
            }}
          >
            {heroHeadline}
          </h1>
          <p className="mx-auto max-w-4xl text-sm leading-relaxed text-text-secondary md:text-base">
            {heroSupportingLine}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
              <Button>
                Book a Discovery Call
              </Button>
            </a>
            <a href="#portfolio">
              <Button variant="outline">
                View Recent Projects
              </Button>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 items-center">
          <div className="space-y-7 order-2 md:order-1">
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">About</h3>
              <div
                className="bio-content text-text-secondary text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">Connect</h3>
              <div className="flex gap-3">
                {profile.socials.map((social) => {
                  const Icon = iconMap[social.icon];
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:text-accent-purple hover:border-accent-purple transition-colors"
                      aria-label={social.platform}
                    >
                      {Icon && <Icon size={16} />}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center order-1 md:order-2">
            <GlowPhoto
              src={profile.profilePhoto}
              alt={profile.name}
              focusX={profile.profilePhotoFocusX}
              focusY={profile.profilePhotoFocusY}
              zoom={profile.profilePhotoZoom}
            />
            {profile.tagline && (
              <p className="text-sm text-text-muted uppercase tracking-wider mt-4 text-center">
                {profile.tagline}
              </p>
            )}
          </div>

          <div className="space-y-6 order-3 md:order-3">
            {displayStats.map((stat) => (
              <StatsCounter key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
