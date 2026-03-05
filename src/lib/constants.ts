export const SITE_NAME = "John/Sing";
export const SITE_TITLE = "John Sasing | Portfolio";
export const SITE_DESCRIPTION = "Full Stack Developer - Personal Portfolio";
export const DEFAULT_PROJECT_THUMBNAIL = "/images/projects/placeholder-1.svg";
export const CALENDLY_URL = "https://calendly.com/johnroldansasing/30min";

export const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Problems", href: "#problems" },
  { label: "How I Work", href: "#services" },
  { label: "Projects", href: "#portfolio" },
  { label: "Engagement", href: "#engagement-models" },
  { label: "Technologies", href: "#technologies" },
  { label: "Contact", href: "#contact" },
] as const;

export const ADMIN_NAV_LINKS = [
  { label: "Profile", href: "/admin/profile", icon: "FaUser" },
  { label: "Sections", href: "/admin/sections", icon: "FaLayerGroup" },
  { label: "How I Work", href: "/admin/services", icon: "FaBriefcase" },
  { label: "Engagement", href: "/admin/engagement-models", icon: "FaHandshake" },
  { label: "Projects", href: "/admin/projects", icon: "FaFolderOpen" },
  { label: "Certifications", href: "/admin/certifications", icon: "FaCertificate" },
] as const;
