"use client";

import {
  Profile,
  Project,
  Service,
  Certification,
  ProjectCategory,
  PageSection,
  EngagementModel,
} from "@/lib/types";
import { usePreloader } from "@/hooks/usePreloader";
import Preloader from "./Preloader";
import Header from "./Header";
import HeroAbout from "./HeroAbout";
import CommonOperationalProblems from "./CommonOperationalProblems";
import Services from "./Services";
import EngagementModels from "./EngagementModels";
import Projects from "./Projects";
import Certifications from "./Certifications";
import TechnologiesPlatforms from "./TechnologiesPlatforms";
import Contact from "./Contact";
import Footer from "./Footer";
import SectionTracker from "@/components/analytics/SectionTracker";
import CustomSection from "./CustomSection";

interface PortfolioNavLink {
  label: string;
  href: string;
}

const DEFAULT_PAGE_SECTIONS: PageSection[] = [
  { id: "section-about", key: "about", label: "About", order: 1, visible: true, isCustom: false },
  { id: "section-problems", key: "problems", label: "Problems", order: 2, visible: true, isCustom: false },
  { id: "section-services", key: "services", label: "How I Work", order: 3, visible: true, isCustom: false },
  {
    id: "section-engagement-models",
    key: "engagement-models",
    label: "Engagement",
    order: 4,
    visible: true,
    isCustom: false,
  },
  { id: "section-portfolio", key: "portfolio", label: "Projects", order: 5, visible: true, isCustom: false },
  {
    id: "section-certifications",
    key: "certifications",
    label: "Certifications",
    order: 6,
    visible: true,
    isCustom: false,
  },
  {
    id: "section-technologies",
    key: "technologies",
    label: "Technologies",
    order: 7,
    visible: true,
    isCustom: false,
  },
  { id: "section-contact", key: "contact", label: "Contact", order: 8, visible: true, isCustom: false },
];

interface PortfolioClientProps {
  profile: Profile;
  projects: Project[];
  projectCategories: ProjectCategory[];
  services: Service[];
  certifications: Certification[];
  pageSections: PageSection[];
  engagementModels: EngagementModel[];
}

export default function PortfolioClient({
  profile,
  projects,
  projectCategories,
  services,
  certifications,
  pageSections,
  engagementModels,
}: PortfolioClientProps) {
  const isLoading = usePreloader(2500);
  const sortedSections = (pageSections.length > 0 ? pageSections : DEFAULT_PAGE_SECTIONS)
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order);

  const navLinks: PortfolioNavLink[] = sortedSections.map((section) => ({
    label: section.label,
    href: section.isCustom ? `#custom-${section.id}` : `#${section.key}`,
  }));

  const renderSection = (section: PageSection) => {
    if (section.isCustom) {
      return (
        <CustomSection
          key={section.id}
          id={section.id}
          title={section.content?.title || section.label}
          bodyHtml={section.content?.bodyHtml}
        />
      );
    }

    switch (section.key) {
      case "about":
        return <HeroAbout key={section.id} profile={profile} />;
      case "problems":
        return (
          <CommonOperationalProblems
            key={section.id}
            problems={section.content?.items || []}
          />
        );
      case "services":
        return (
          <Services
            key={section.id}
            services={services}
            sectionContent={section.content}
          />
        );
      case "engagement-models":
        return <EngagementModels key={section.id} models={engagementModels} />;
      case "portfolio":
        return (
          <Projects
            key={section.id}
            projects={projects}
            projectCategories={projectCategories}
          />
        );
      case "certifications":
        return <Certifications key={section.id} certifications={certifications} />;
      case "technologies":
        return <TechnologiesPlatforms key={section.id} skills={profile.skills} />;
      case "contact":
        return <Contact key={section.id} profile={profile} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Preloader isLoading={isLoading} />
      <SectionTracker />
      <Header navLinks={navLinks} />
      <main className="w-full">
        {sortedSections.map((section, index) => (
          <div key={section.id}>
            {renderSection(section)}
            {index < sortedSections.length - 1 && <div className="section-separator" />}
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}
