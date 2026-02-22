-- ===================================================
-- JRS Portfolio – Supabase Migration
-- Run this SQL in the Supabase Dashboard SQL Editor
-- ===================================================

-- 1. Profile (singleton row)
CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  profile_photo TEXT NOT NULL DEFAULT '',
  experience_start_year INTEGER NOT NULL DEFAULT 2018,
  profile_photo_focus_x REAL DEFAULT 50,
  profile_photo_focus_y REAL DEFAULT 50,
  profile_photo_zoom REAL DEFAULT 1,
  skills JSONB NOT NULL DEFAULT '[]',
  stats JSONB NOT NULL DEFAULT '[]',
  socials JSONB NOT NULL DEFAULT '[]',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  favicon TEXT NOT NULL DEFAULT ''
);

-- 2. Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  categories JSONB NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  thumbnail TEXT NOT NULL DEFAULT '',
  thumbnail_focus_x REAL DEFAULT 50,
  thumbnail_focus_y REAL DEFAULT 50,
  thumbnail_zoom REAL DEFAULT 1,
  gallery JSONB NOT NULL DEFAULT '[]',
  attachments JSONB NOT NULL DEFAULT '[]',
  links JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 3. Project categories
CREATE TABLE IF NOT EXISTS project_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 4. Services
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 5. Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  organization TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  credential_url TEXT NOT NULL DEFAULT '',
  credential_id TEXT NOT NULL DEFAULT '',
  thumbnail TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]',
  palette_code TEXT NOT NULL DEFAULT '',
  badge_color TEXT NOT NULL DEFAULT '#8b5cf6',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 6. Contact submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message_text TEXT NOT NULL DEFAULT '',
  message_html TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================
-- Row Level Security
-- ===================================================

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public read access (anon key)
CREATE POLICY "Public read profile"
  ON profile FOR SELECT TO anon USING (true);

CREATE POLICY "Public read projects"
  ON projects FOR SELECT TO anon USING (true);

CREATE POLICY "Public read project_categories"
  ON project_categories FOR SELECT TO anon USING (true);

CREATE POLICY "Public read services"
  ON services FOR SELECT TO anon USING (true);

CREATE POLICY "Public read certifications"
  ON certifications FOR SELECT TO anon USING (true);

-- Contact submissions: anon can insert (public form), no read
CREATE POLICY "Public insert contact_submissions"
  ON contact_submissions FOR INSERT TO anon
  WITH CHECK (true);

-- Service role has full access by default (bypasses RLS)

-- ===================================================
-- Storage bucket for images
-- ===================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads on the images bucket
CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'images');

-- Allow service_role to manage images (upload/delete)
CREATE POLICY "Service role manage images"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'images');
