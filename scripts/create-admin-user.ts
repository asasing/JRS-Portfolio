/**
 * Creates an admin user in Supabase Auth.
 *
 * Usage:
 *   npx tsx scripts/create-admin-user.ts <email> <password>
 *
 * Example:
 *   npx tsx scripts/create-admin-user.ts admin@example.com MySecurePassword123
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

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-admin-user.ts <email> <password>");
  process.exit(1);
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }

  console.log(`Admin user created successfully.`);
  console.log(`  Email: ${data.user.email}`);
  console.log(`  ID:    ${data.user.id}`);
  console.log(`\nYou can now log in at /admin/login with these credentials.`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
