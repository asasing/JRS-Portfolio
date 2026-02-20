"use client";

import { useEffect, useState } from "react";
import { Profile } from "@/lib/types";
import GlowPhoto from "./GlowPhoto";
import StatsCounter from "./StatsCounter";
import { FaLinkedinIn, FaGithub, FaEnvelope, FaTwitter } from "react-icons/fa";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  FaLinkedinIn,
  FaGithub,
  FaEnvelope,
  FaTwitter,
};

interface HeroAboutProps {
  profile: Profile;
}

export default function HeroAbout({ profile }: HeroAboutProps) {
  const [typedName, setTypedName] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);

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

  useEffect(() => {
    const fullName = profile.name || "";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let interval: number | undefined;

    const frame = window.requestAnimationFrame(() => {
      if (!fullName || reducedMotion) {
        setTypedName(fullName);
        setIsTypingDone(true);
        return;
      }

      setTypedName("");
      setIsTypingDone(false);

      let nextIndex = 0;
      interval = window.setInterval(() => {
        nextIndex += 1;
        setTypedName(fullName.slice(0, nextIndex));

        if (nextIndex >= fullName.length) {
          window.clearInterval(interval);
          setIsTypingDone(true);
        }
      }, 70);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [profile.name]);

  return (
    <section id="about" className="min-h-screen flex items-center pt-20 pb-16">
      <div className="site-container">
        <h1 className="hero-code-title">
          <span className="hero-code-title__text" aria-label={profile.name}>
            <span className="hero-code-title__typed">{typedName}</span>
            <span
              className={`hero-code-title__cursor ${
                isTypingDone ? "" : "hero-code-title__cursor--typing"
              }`}
              aria-hidden="true"
            >
              |
            </span>
          </span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 items-center">
          <div className="space-y-7 order-2 md:order-1">
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">About</h3>
              <div
                className="bio-content text-text-secondary text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: profile.bio }}
              />
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">Skills</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {profile.skills.join(" | ")}
              </p>
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

          <div className="flex justify-center order-1 md:order-2">
            <GlowPhoto
              src={profile.profilePhoto}
              alt={profile.name}
              focusX={profile.profilePhotoFocusX}
              focusY={profile.profilePhotoFocusY}
              zoom={profile.profilePhotoZoom}
            />
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
