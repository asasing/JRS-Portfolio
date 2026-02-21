import { readJsonFile } from "@/lib/data";
import {
  Profile,
  Project,
  Service,
  Certification,
  ProjectCategory,
} from "@/lib/types";
import PortfolioClient from "@/components/portfolio/PortfolioClient";
import { normalizeProfileData } from "@/lib/profile-normalizers";
import { normalizeProjects } from "@/lib/project-normalizers";
import { normalizeProjectCategoryList } from "@/lib/project-category-normalizers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rawProfile = await readJsonFile<Partial<Profile>>("profile.json");
  const profile = normalizeProfileData(rawProfile);
  const rawProjects = await readJsonFile<Partial<Project>[]>("projects.json");
  const projects = normalizeProjects(rawProjects);
  let rawProjectCategories: Partial<ProjectCategory>[] = [];

  try {
    rawProjectCategories = await readJsonFile<Partial<ProjectCategory>[]>(
      "project-categories.json"
    );
  } catch {
    rawProjectCategories = [];
  }

  const projectCategories = normalizeProjectCategoryList(
    rawProjectCategories,
    projects
  );
  const services = await readJsonFile<Service[]>("services.json");
  const certifications = await readJsonFile<Certification[]>("certifications.json");

  return (
    <PortfolioClient
      profile={profile}
      projects={projects}
      projectCategories={projectCategories}
      services={services}
      certifications={certifications}
    />
  );
}
