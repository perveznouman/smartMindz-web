import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getFestCategory, getOnlineEvents } from "@/lib/data/festEvents";

interface VideoRegistrationRow {
  id: string;
  full_name: string;
  video_drive_file_id: string | null;
}

export type VideoLookupResult =
  | { ok: true; row: VideoRegistrationRow }
  | { ok: false; status: number; error: string };

/**
 * Shared by /api/video/verify and /api/video/session (and re-checked, not
 * just trusted, by session — never rely on an earlier request alone). Confirms
 * the 4-digit code belongs to a registration for exactly this category +
 * online event, and that it hasn't already received a video.
 */
export async function findVideoRegistration(
  supabase: SupabaseClient,
  {
    registrationCode,
    categoryId,
    eventName,
  }: { registrationCode: number; categoryId: string; eventName: string },
): Promise<VideoLookupResult> {
  const category = getFestCategory(categoryId);
  if (!category) {
    return { ok: false, status: 400, error: "Invalid category." };
  }
  if (!getOnlineEvents(categoryId).includes(eventName)) {
    return { ok: false, status: 400, error: "That event isn't open for video upload." };
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("id, full_name, video_drive_file_id")
    .eq("registration_code", registrationCode)
    .eq("category_name", category.name)
    .eq("event_name", eventName)
    .maybeSingle();

  if (error) {
    console.error("Video registration lookup failed:", error.message);
    return { ok: false, status: 500, error: "Something went wrong. Please try again." };
  }
  if (!data) {
    return {
      ok: false,
      status: 404,
      error:
        "We couldn't find a registration with that number for this event. Double-check the code and try again.",
    };
  }
  if (data.video_drive_file_id) {
    return {
      ok: false,
      status: 409,
      error:
        "You've already uploaded a video for this registration. Message us on WhatsApp if you need to replace it.",
    };
  }
  return { ok: true, row: data };
}
