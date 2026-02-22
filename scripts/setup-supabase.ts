/**
 * Supabase setup script: creates the storage bucket and verifies tables exist.
 *
 * Usage:
 *   npx tsx scripts/setup-supabase.ts
 *
 * If tables don't exist, this script will print the URL for the SQL Editor
 * where you can paste and run scripts/supabase-migration.sql.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ref = SUPABASE_URL.replace("https://", "").split(".")[0];

async function createBucket() {
  console.log("Creating storage bucket 'images'...");

  const { data: existing } = await supabase.storage.getBucket("images");
  if (existing) {
    console.log("  Bucket 'images' already exists.");
    return;
  }

  const { error } = await supabase.storage.createBucket("images", {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ],
  });

  if (error) {
    console.error("  Failed to create bucket:", error.message);
  } else {
    console.log("  Bucket 'images' created.");
  }
}

async function checkTables() {
  const tables = [
    "profile",
    "projects",
    "project_categories",
    "services",
    "certifications",
    "contact_submissions",
  ];

  console.log("\nChecking tables...");
  let allExist = true;

  for (const table of tables) {
    const { error } = await supabase.from(table).select("*").limit(0);
    if (error) {
      console.log(`  ✗ ${table} - not found`);
      allExist = false;
    } else {
      console.log(`  ✓ ${table}`);
    }
  }

  if (!allExist) {
    console.log("\n⚠ Some tables are missing.");
    console.log("Please run the SQL migration in the Supabase Dashboard:");
    console.log(
      `  https://supabase.com/dashboard/project/${ref}/sql/new`
    );
    console.log("  Paste the contents of: scripts/supabase-migration.sql");
    console.log("  Then re-run this script to verify.");
    return false;
  }

  console.log("\nAll tables exist.");
  return true;
}

async function main() {
  console.log(`Supabase project: ${ref}`);
  console.log(`URL: ${SUPABASE_URL}\n`);

  await createBucket();
  const tablesReady = await checkTables();

  if (tablesReady) {
    console.log("\n✓ Setup complete. You can now run:");
    console.log("  npx tsx scripts/migrate-to-supabase.ts");
  }
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
