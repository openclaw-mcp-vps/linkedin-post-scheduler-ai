import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface ScheduledPostRow {
  id: string;
  user_email: string;
  content: string;
  scheduled_for: string;
  content_type: string;
  hashtags: string[];
  predicted_engagement: number;
  status: string;
  created_at: string;
}

let cachedAdminClient: SupabaseClient | null | undefined;

export function getSupabaseAdminClient() {
  if (cachedAdminClient !== undefined) {
    return cachedAdminClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    cachedAdminClient = null;
    return cachedAdminClient;
  }

  cachedAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedAdminClient;
}

export async function insertScheduledPostAnalytics(row: ScheduledPostRow) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.from("scheduled_posts").upsert(row);
}
