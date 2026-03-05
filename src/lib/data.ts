import "server-only";

import { supabase, supabaseAdmin } from "@/lib/supabase";
import {
  Profile,
  Project,
  ProjectCategory,
  Service,
  Certification,
  PageSection,
  EngagementModel,
  PageSectionContent,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// DB row ↔ App type mappers
// ---------------------------------------------------------------------------

interface ProfileRow {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  profile_photo: string;
  experience_start_year: number;
  profile_photo_focus_x: number | null;
  profile_photo_focus_y: number | null;
  profile_photo_zoom: number | null;
  skills: string[];
  stats: { label: string; value: string }[];
  socials: { platform: string; url: string; icon: string }[];
  email: string;
  phone: string;
  favicon: string;
  hero_headline: string;
  hero_supporting_line: string;
}

function profileFromRow(row: ProfileRow): Profile {
  return {
    name: row.name,
    tagline: row.tagline,
    bio: row.bio,
    profilePhoto: row.profile_photo,
    experienceStartYear: row.experience_start_year,
    profilePhotoFocusX: row.profile_photo_focus_x ?? 50,
    profilePhotoFocusY: row.profile_photo_focus_y ?? 50,
    profilePhotoZoom: row.profile_photo_zoom ?? 1,
    skills: row.skills ?? [],
    stats: row.stats ?? [],
    socials: row.socials ?? [],
    email: row.email,
    phone: row.phone,
    favicon: row.favicon,
    heroHeadline: row.hero_headline,
    heroSupportingLine: row.hero_supporting_line,
  };
}

function profileToRow(p: Profile): Omit<ProfileRow, "id"> {
  return {
    name: p.name,
    tagline: p.tagline,
    bio: p.bio,
    profile_photo: p.profilePhoto,
    experience_start_year: p.experienceStartYear,
    profile_photo_focus_x: p.profilePhotoFocusX ?? 50,
    profile_photo_focus_y: p.profilePhotoFocusY ?? 50,
    profile_photo_zoom: p.profilePhotoZoom ?? 1,
    skills: p.skills,
    stats: p.stats,
    socials: p.socials,
    email: p.email,
    phone: p.phone,
    favicon: p.favicon ?? "",
    hero_headline: p.heroHeadline ?? "",
    hero_supporting_line: p.heroSupportingLine ?? "",
  };
}

interface ProjectRow {
  id: string;
  title: string;
  category: string;
  categories: string[];
  description: string;
  thumbnail: string;
  thumbnail_focus_x: number | null;
  thumbnail_focus_y: number | null;
  thumbnail_zoom: number | null;
  gallery: string[];
  attachments: unknown[];
  links: { label: string; url: string }[];
  sort_order: number;
}

function projectFromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categories: row.categories ?? [],
    description: row.description,
    thumbnail: row.thumbnail,
    thumbnailFocusX: row.thumbnail_focus_x ?? 50,
    thumbnailFocusY: row.thumbnail_focus_y ?? 50,
    thumbnailZoom: row.thumbnail_zoom ?? 1,
    gallery: row.gallery ?? [],
    links: row.links ?? [],
    order: row.sort_order,
  };
}

function projectToRow(p: Project): ProjectRow {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    categories: p.categories ?? [],
    description: p.description,
    thumbnail: p.thumbnail,
    thumbnail_focus_x: p.thumbnailFocusX ?? 50,
    thumbnail_focus_y: p.thumbnailFocusY ?? 50,
    thumbnail_zoom: p.thumbnailZoom ?? 1,
    gallery: p.gallery ?? [],
    attachments: (p.attachments as unknown[]) ?? [],
    links: p.links ?? [],
    sort_order: p.order,
  };
}

interface CategoryRow {
  id: string;
  label: string;
  sort_order: number;
}

function categoryFromRow(row: CategoryRow): ProjectCategory {
  return { id: row.id, label: row.label, order: row.sort_order };
}

function categoryToRow(c: ProjectCategory): CategoryRow {
  return { id: c.id, label: c.label, sort_order: c.order };
}

interface ServiceRow {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
}

function serviceFromRow(row: ServiceRow): Service {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description,
    icon: row.icon,
    order: row.sort_order,
  };
}

function serviceToRow(s: Service): ServiceRow {
  return {
    id: s.id,
    number: s.number,
    title: s.title,
    description: s.description,
    icon: s.icon,
    sort_order: s.order,
  };
}

interface CertificationRow {
  id: string;
  name: string;
  year: string;
  organization: string;
  description: string;
  credential_url: string;
  credential_id: string;
  thumbnail: string;
  attachments: unknown[];
  palette_code: string;
  badge_color: string;
  sort_order: number;
}

function certFromRow(row: CertificationRow): Certification {
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    organization: row.organization,
    description: row.description,
    credentialUrl: row.credential_url,
    credentialId: row.credential_id,
    thumbnail: row.thumbnail,
    attachments: (row.attachments as Certification["attachments"]) ?? [],
    paletteCode: row.palette_code,
    badgeColor: row.badge_color,
    order: row.sort_order,
  };
}

function certToRow(c: Certification): CertificationRow {
  return {
    id: c.id,
    name: c.name,
    year: c.year,
    organization: c.organization,
    description: c.description,
    credential_url: c.credentialUrl ?? "",
    credential_id: c.credentialId ?? "",
    thumbnail: c.thumbnail ?? "",
    attachments: (c.attachments as unknown[]) ?? [],
    palette_code: c.paletteCode ?? "",
    badge_color: c.badgeColor,
    sort_order: c.order,
  };
}

interface PageSectionRow {
  id: string;
  key: string;
  label: string;
  sort_order: number;
  visible: boolean;
  is_custom: boolean;
  content: unknown;
}

function normalizeSectionContent(value: unknown): PageSectionContent | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as PageSectionContent;
}

function pageSectionFromRow(row: PageSectionRow): PageSection {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    order: row.sort_order,
    visible: row.visible,
    isCustom: row.is_custom,
    content: normalizeSectionContent(row.content),
  };
}

function pageSectionToRow(section: PageSection): PageSectionRow {
  return {
    id: section.id,
    key: section.key,
    label: section.label,
    sort_order: section.order,
    visible: section.visible,
    is_custom: section.isCustom,
    content: section.content ?? {},
  };
}

interface EngagementModelRow {
  id: string;
  title: string;
  description: string;
  sort_order: number;
}

function engagementModelFromRow(row: EngagementModelRow): EngagementModel {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    order: row.sort_order,
  };
}

function engagementModelToRow(model: EngagementModel): EngagementModelRow {
  return {
    id: model.id,
    title: model.title,
    description: model.description,
    sort_order: model.order,
  };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function getProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", "default")
    .single();

  if (error || !data) {
    return {
      name: "",
      tagline: "",
      bio: "",
      profilePhoto: "",
      experienceStartYear: 2018,
      skills: [],
      stats: [],
      socials: [],
      email: "",
      phone: "",
      heroHeadline: "",
      heroSupportingLine: "",
    };
  }

  return profileFromRow(data as ProfileRow);
}

export async function updateProfile(profile: Profile): Promise<Profile> {
  const row = profileToRow(profile);
  const { data, error } = await supabaseAdmin
    .from("profile")
    .upsert({ id: "default", ...row })
    .select()
    .single();

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return profileFromRow(data as ProfileRow);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return (data as ProjectRow[]).map(projectFromRow);
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return projectFromRow(data as ProjectRow);
}

export async function createProject(project: Project): Promise<Project> {
  const row = projectToRow(project);
  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return projectFromRow(data as ProjectRow);
}

export async function updateProject(
  id: string,
  project: Partial<Project>
): Promise<Project | null> {
  const existing = await getProject(id);
  if (!existing) return null;

  const merged = { ...existing, ...project, id };
  const row = projectToRow(merged);

  const { data, error } = await supabaseAdmin
    .from("projects")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update project: ${error.message}`);
  return projectFromRow(data as ProjectRow);
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete project: ${error.message}`);
  return (count ?? 1) > 0;
}

export async function reorderProjects(
  orderedIds: string[]
): Promise<Project[]> {
  const projects = await getProjects();
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const updates: { id: string; sort_order: number }[] = [];

  for (let i = 0; i < orderedIds.length; i++) {
    if (!projectMap.has(orderedIds[i])) {
      throw new Error(`Unknown project ID: ${orderedIds[i]}`);
    }
    updates.push({ id: orderedIds[i], sort_order: i + 1 });
  }

  for (const u of updates) {
    await supabaseAdmin
      .from("projects")
      .update({ sort_order: u.sort_order })
      .eq("id", u.id);
  }

  return getProjects();
}

// ---------------------------------------------------------------------------
// Project Categories
// ---------------------------------------------------------------------------

export async function getProjectCategories(): Promise<ProjectCategory[]> {
  const { data, error } = await supabase
    .from("project_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data as CategoryRow[]).map(categoryFromRow);
}

export async function updateProjectCategories(
  categories: ProjectCategory[]
): Promise<ProjectCategory[]> {
  await supabaseAdmin.from("project_categories").delete().neq("id", "");

  if (categories.length > 0) {
    const rows = categories.map(categoryToRow);
    const { error } = await supabaseAdmin
      .from("project_categories")
      .insert(rows);
    if (error)
      throw new Error(`Failed to update categories: ${error.message}`);
  }

  return getProjectCategories();
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch services: ${error.message}`);
  return (data as ServiceRow[]).map(serviceFromRow);
}

export async function updateServices(services: Service[]): Promise<Service[]> {
  await supabaseAdmin.from("services").delete().neq("id", "");

  if (services.length > 0) {
    const rows = services.map(serviceToRow);
    const { error } = await supabaseAdmin.from("services").insert(rows);
    if (error) throw new Error(`Failed to update services: ${error.message}`);
  }

  return getServices();
}

// ---------------------------------------------------------------------------
// Page Sections
// ---------------------------------------------------------------------------

export async function getPageSections(): Promise<PageSection[]> {
  const { data, error } = await supabase
    .from("page_sections")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data as PageSectionRow[]).map(pageSectionFromRow);
}

export async function updatePageSections(
  sections: PageSection[]
): Promise<PageSection[]> {
  await supabaseAdmin.from("page_sections").delete().neq("id", "");

  if (sections.length > 0) {
    const rows = sections.map(pageSectionToRow);
    const { error } = await supabaseAdmin.from("page_sections").insert(rows);
    if (error)
      throw new Error(`Failed to update page sections: ${error.message}`);
  }

  return getPageSections();
}

// ---------------------------------------------------------------------------
// Engagement Models
// ---------------------------------------------------------------------------

export async function getEngagementModels(): Promise<EngagementModel[]> {
  const { data, error } = await supabase
    .from("engagement_models")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data as EngagementModelRow[]).map(engagementModelFromRow);
}

export async function updateEngagementModels(
  models: EngagementModel[]
): Promise<EngagementModel[]> {
  await supabaseAdmin.from("engagement_models").delete().neq("id", "");

  if (models.length > 0) {
    const rows = models.map(engagementModelToRow);
    const { error } = await supabaseAdmin
      .from("engagement_models")
      .insert(rows);
    if (error)
      throw new Error(`Failed to update engagement models: ${error.message}`);
  }

  return getEngagementModels();
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

export async function getCertifications(): Promise<Certification[]> {
  const { data, error } = await supabase
    .from("certifications")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error)
    throw new Error(`Failed to fetch certifications: ${error.message}`);
  return (data as CertificationRow[]).map(certFromRow);
}

export async function getCertification(
  id: string
): Promise<Certification | null> {
  const { data, error } = await supabase
    .from("certifications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return certFromRow(data as CertificationRow);
}

export async function createCertification(
  cert: Certification
): Promise<Certification> {
  const row = certToRow(cert);
  const { data, error } = await supabaseAdmin
    .from("certifications")
    .insert(row)
    .select()
    .single();

  if (error)
    throw new Error(`Failed to create certification: ${error.message}`);
  return certFromRow(data as CertificationRow);
}

export async function updateCertification(
  id: string,
  cert: Partial<Certification>
): Promise<Certification | null> {
  const existing = await getCertification(id);
  if (!existing) return null;

  const merged = { ...existing, ...cert, id };
  const row = certToRow(merged);

  const { data, error } = await supabaseAdmin
    .from("certifications")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error)
    throw new Error(`Failed to update certification: ${error.message}`);
  return certFromRow(data as CertificationRow);
}

export async function deleteCertification(id: string): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from("certifications")
    .delete()
    .eq("id", id);

  if (error)
    throw new Error(`Failed to delete certification: ${error.message}`);
  return (count ?? 1) > 0;
}

export async function reorderCertifications(
  orderedIds: string[]
): Promise<Certification[]> {
  const certs = await getCertifications();
  const certMap = new Map(certs.map((c) => [c.id, c]));

  for (let i = 0; i < orderedIds.length; i++) {
    if (!certMap.has(orderedIds[i])) {
      throw new Error(`Unknown certification ID: ${orderedIds[i]}`);
    }
    await supabaseAdmin
      .from("certifications")
      .update({ sort_order: i + 1 })
      .eq("id", orderedIds[i]);
  }

  return getCertifications();
}

// ---------------------------------------------------------------------------
// Contact Submissions
// ---------------------------------------------------------------------------

export async function createContactSubmission(data: {
  name: string;
  email: string;
  subject: string;
  messageText: string;
  messageHtml: string;
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .insert({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message_text: data.messageText,
      message_html: data.messageHtml,
    });

  if (error)
    throw new Error(`Failed to store contact submission: ${error.message}`);
}
