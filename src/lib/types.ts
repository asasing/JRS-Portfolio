export interface Profile {
  name: string;
  tagline: string;
  bio: string;
  profilePhoto: string;
  experienceStartYear: number;
  profilePhotoFocusX?: number;
  profilePhotoFocusY?: number;
  profilePhotoZoom?: number;
  skills: string[];
  stats: { label: string; value: string }[];
  socials: { platform: string; url: string; icon: string }[];
  email: string;
  phone: string;
}

export interface Attachment {
  id: string;
  label: string;
  url: string;
  mimeType:
    | "application/pdf"
    | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

export interface Project {
  id: string;
  title: string;
  category: string;
  categories?: string[];
  description: string;
  thumbnail: string;
  thumbnailFocusX?: number;
  thumbnailFocusY?: number;
  thumbnailZoom?: number;
  gallery: string[];
  attachments?: Attachment[];
  links: { label: string; url: string }[];
  order: number;
}

export interface ProjectCategory {
  id: string;
  label: string;
  order: number;
}

export interface Certification {
  id: string;
  name: string;
  year: string;
  organization: string;
  description: string;
  credentialUrl?: string;
  credentialId?: string;
  thumbnail?: string;
  attachments?: Attachment[];
  paletteCode?: string;
  badgeColor: string;
  order: number;
}

export interface Service {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: string;
  order: number;
}
