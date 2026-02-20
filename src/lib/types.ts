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

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  thumbnailFocusX?: number;
  thumbnailFocusY?: number;
  thumbnailZoom?: number;
  gallery: string[];
  links: { label: string; url: string }[];
  order: number;
}

export interface Certification {
  id: string;
  name: string;
  year: string;
  organization: string;
  description: string;
  credentialUrl?: string;
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
