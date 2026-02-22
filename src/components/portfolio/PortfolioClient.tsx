"use client";

import {
  Profile,
  Project,
  Service,
  Certification,
  ProjectCategory,
} from "@/lib/types";
import { usePreloader } from "@/hooks/usePreloader";
import Preloader from "./Preloader";
import Header from "./Header";
import HeroAbout from "./HeroAbout";
import Services from "./Services";
import Projects from "./Projects";
import Certifications from "./Certifications";
import Contact from "./Contact";
import Footer from "./Footer";
import SectionTracker from "@/components/analytics/SectionTracker";

interface PortfolioClientProps {
  profile: Profile;
  projects: Project[];
  projectCategories: ProjectCategory[];
  services: Service[];
  certifications: Certification[];
}

export default function PortfolioClient({
  profile,
  projects,
  projectCategories,
  services,
  certifications,
}: PortfolioClientProps) {
  const isLoading = usePreloader(2500);

  return (
    <>
      <Preloader isLoading={isLoading} />
      <SectionTracker />
      <Header />
      <main className="w-full">
        <HeroAbout profile={profile} />
        <div className="section-separator" />
        <Services services={services} />
        <div className="section-separator" />
        <Projects projects={projects} projectCategories={projectCategories} />
        <div className="section-separator" />
        <Certifications certifications={certifications} />
        <div className="section-separator" />
        <Contact profile={profile} />
      </main>
      <Footer />
    </>
  );
}
