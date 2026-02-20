"use client";

import { Profile, Project, Service, Certification } from "@/lib/types";
import { usePreloader } from "@/hooks/usePreloader";
import Preloader from "./Preloader";
import Header from "./Header";
import HeroAbout from "./HeroAbout";
import Services from "./Services";
import Projects from "./Projects";
import Certifications from "./Certifications";
import Contact from "./Contact";
import Footer from "./Footer";

interface PortfolioClientProps {
  profile: Profile;
  projects: Project[];
  services: Service[];
  certifications: Certification[];
}

export default function PortfolioClient({
  profile,
  projects,
  services,
  certifications,
}: PortfolioClientProps) {
  const isLoading = usePreloader(2500);

  return (
    <>
      <Preloader isLoading={isLoading} />
      <Header />
      <main className="w-full">
        <HeroAbout profile={profile} />
        <div className="section-separator" />
        <Services services={services} />
        <div className="section-separator" />
        <Projects projects={projects} />
        <div className="section-separator" />
        <Certifications certifications={certifications} />
        <div className="section-separator" />
        <Contact profile={profile} />
      </main>
      <Footer />
    </>
  );
}
