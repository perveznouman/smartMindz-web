import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  isSupabaseWritable,
  supabaseAnonKey,
  supabaseServiceKey,
  supabaseUrl,
} from "./env";

/**
 * Server-side Supabase clients. These are only ever imported by server code
 * (RSC, route handlers, scripts) — never shipped to the browser.
 */

let readClient: SupabaseClient | null = null;
let writeClient: SupabaseClient | null = null;

/** Read client (anon key) for fetching public content. Null if not configured. */
export function getServerReadClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!readClient) {
    readClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  return readClient;
}

/**
 * Write client (service role) for inserting registrations and admin reads.
 * Bypasses RLS — use only on the server. Null if the service key is missing.
 */
export function getServiceClient(): SupabaseClient | null {
  if (!isSupabaseWritable) return null;
  if (!writeClient) {
    writeClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return writeClient;
}
