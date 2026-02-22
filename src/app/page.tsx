import {
  getProfile,
  getProjects,
  getProjectCategories,
  getServices,
  getCertifications,
} from "@/lib/data";
import PortfolioClient from "@/components/portfolio/PortfolioClient";
import { normalizeProfileData } from "@/lib/profile-normalizers";
import { normalizeProjects } from "@/lib/project-normalizers";
import { normalizeProjectCategoryList } from "@/lib/project-category-normalizers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rawProfile = await getProfile();
  const profile = normalizeProfileData(rawProfile);
  const rawProjects = await getProjects();
  const projects = normalizeProjects(rawProjects);
  const rawProjectCategories = await getProjectCategories();
  const projectCategories = normalizeProjectCategoryList(
    rawProjectCategories,
    projects
  );
  const services = await getServices();
  const certifications = await getCertifications();

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
