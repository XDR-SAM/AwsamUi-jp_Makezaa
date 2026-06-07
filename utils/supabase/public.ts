import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Anonymous client for public CMS reads — no cookies or auth session required */
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseKey);
}
