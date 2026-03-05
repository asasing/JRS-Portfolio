-- ===================================================
-- JRS Portfolio – Content Management Overhaul
-- Run this SQL in the Supabase Dashboard SQL Editor
-- ===================================================

-- 1) Profile additions for hero copy
ALTER TABLE profile
  ADD COLUMN IF NOT EXISTS hero_headline TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_supporting_line TEXT NOT NULL DEFAULT '';

-- 2) Page sections (order, visibility, custom content)
CREATE TABLE IF NOT EXISTS page_sections (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  content JSONB NOT NULL DEFAULT '{}'
);

-- 3) Engagement models (replaces hardcoded cards)
CREATE TABLE IF NOT EXISTS engagement_models (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read page_sections"
  ON page_sections FOR SELECT TO anon USING (true);

CREATE POLICY "Public read engagement_models"
  ON engagement_models FOR SELECT TO anon USING (true);

-- Seed built-in sections in the current public portfolio order.
INSERT INTO page_sections (id, key, label, sort_order, visible, is_custom, content)
VALUES
  (
    'section-about',
    'about',
    'About',
    1,
    true,
    false,
    '{}'
  ),
  (
    'section-problems',
    'problems',
    'Problems',
    2,
    true,
    false,
    '{"items":["Teams relying heavily on spreadsheets to manage operations","Manual approval workflows slowing down processes","Disconnected business tools causing poor visibility","CRM systems lacking automation and integrations","Internal reporting requiring excessive manual effort"]}'::jsonb
  ),
  (
    'section-services',
    'services',
    'How I Work',
    3,
    true,
    false,
    '{"heading":"How I Work","intro":"To keep projects focused and predictable, engagements follow a structured three-phase delivery model.","steps":[{"title":"Discovery & Planning","description":"To keep projects focused and predictable, engagements follow a structured three-phase delivery model.","image":"/images/services/how-i-work-discovery.svg"},{"title":"Build & Integration","description":"The solution is developed and integrated with your existing systems while keeping security, governance, and maintainability in focus.","image":"/images/services/how-i-work-build.svg"},{"title":"Deployment, Training & Handover","description":"A 14-day post-deployment warranty period is included to address any issues and ensure the system operates smoothly.","image":"/images/services/how-i-work-deploy.svg"}]}'::jsonb
  ),
  (
    'section-engagement-models',
    'engagement-models',
    'Engagement',
    4,
    true,
    false,
    '{}'
  ),
  (
    'section-portfolio',
    'portfolio',
    'Projects',
    5,
    true,
    false,
    '{}'
  ),
  (
    'section-certifications',
    'certifications',
    'Certifications',
    6,
    true,
    false,
    '{}'
  ),
  (
    'section-technologies',
    'technologies',
    'Technologies',
    7,
    true,
    false,
    '{}'
  ),
  (
    'section-contact',
    'contact',
    'Contact',
    8,
    true,
    false,
    '{}'
  )
ON CONFLICT (id) DO NOTHING;

-- Ensure the built-in services section includes default step images for existing rows.
UPDATE page_sections
SET content = jsonb_set(
  jsonb_set(
    jsonb_set(
      content,
      '{steps,0,image}',
      to_jsonb('/images/services/how-i-work-discovery.svg'::text),
      true
    ),
    '{steps,1,image}',
    to_jsonb('/images/services/how-i-work-build.svg'::text),
    true
  ),
  '{steps,2,image}',
  to_jsonb('/images/services/how-i-work-deploy.svg'::text),
  true
)
WHERE key = 'services'
  AND is_custom = false;

-- Seed engagement models with current defaults.
INSERT INTO engagement_models (id, title, description, sort_order)
VALUES
  (
    'engagement-model-1',
    'Automation Sprint',
    'Short engagement focused on automating a specific operational workflow or internal system.',
    1
  ),
  (
    'engagement-model-2',
    'Architecture & Consulting',
    'System design and planning for organisations modernising internal operations.',
    2
  ),
  (
    'engagement-model-3',
    'Ongoing Automation Partner',
    'Continuous system improvements, automation expansion, and optimisation support.',
    3
  )
ON CONFLICT (id) DO NOTHING;
