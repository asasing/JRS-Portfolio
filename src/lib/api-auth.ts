import { createSupabaseServerClient } from "@/lib/supabase";

export async function authenticateRequest(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user !== null;
  } catch {
    return false;
  }
}
