/** Centralised Supabase env access + a single "is it configured?" check. */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const supabaseBucket =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "smartmindz";

/** True when public reads are possible (URL + anon key present). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** True when server-side writes are possible (URL + service role present). */
export const isSupabaseWritable = Boolean(supabaseUrl && supabaseServiceKey);
