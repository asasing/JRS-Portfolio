export const SITE_NAME = "JS";
export const SITE_TITLE = "John Sasing | Portfolio";
export const SITE_DESCRIPTION = "Full Stack Developer - Personal Portfolio";
export const DEFAULT_PROJECT_THUMBNAIL = "/images/projects/placeholder-1.svg";

export const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Certifications", href: "#certifications" },
  { label: "Contact", href: "#contact" },
] as const;

export const ADMIN_NAV_LINKS = [
  { label: "Projects", href: "/admin/projects", icon: "FaFolderOpen" },
  { label: "Certifications", href: "/admin/certifications", icon: "FaCertificate" },
  { label: "Services", href: "/admin/services", icon: "FaBriefcase" },
  { label: "Profile", href: "/admin/profile", icon: "FaUser" },
] as const;
