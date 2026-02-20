import { readJsonFile } from "@/lib/data";
import { Profile, Project, Service, Certification } from "@/lib/types";
import PortfolioClient from "@/components/portfolio/PortfolioClient";
import { normalizeProfileData } from "@/lib/profile-normalizers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rawProfile = await readJsonFile<Partial<Profile>>("profile.json");
  const profile = normalizeProfileData(rawProfile);
  const projects = await readJsonFile<Project[]>("projects.json");
  const services = await readJsonFile<Service[]>("services.json");
  const certifications = await readJsonFile<Certification[]>("certifications.json");

  return (
    <PortfolioClient
      profile={profile}
      projects={projects}
      services={services}
      certifications={certifications}
    />
  );
}
