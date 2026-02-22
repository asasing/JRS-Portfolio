import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export function getImagePublicUrl(bucketPath: string): string {
  if (!bucketPath) return "";
  if (bucketPath.startsWith("http")) return bucketPath;
  return `${supabaseUrl}/storage/v1/object/public/images/${bucketPath}`;
}

export function extractStoragePath(url: string): string | null {
  if (!url) return null;
  const prefix = `${supabaseUrl}/storage/v1/object/public/images/`;
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  if (url.startsWith("/images/")) {
    return url.slice("/images/".length);
  }
  return null;
}
