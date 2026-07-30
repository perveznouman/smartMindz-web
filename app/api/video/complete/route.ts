import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/data";
import { getFestCategory } from "@/lib/data/festEvents";
import { findLatestFileByPrefix } from "@/lib/google/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/video/complete
 * Step 3 — called after the browser's best-effort PUT to Drive (see
 * UploadForm.tsx), regardless of whether that PUT itself reported success.
 * A browser reading the PUT's own confirmation is subject to CORS/response
 * timing quirks that don't reliably reflect whether the file actually
 * landed — this route is the authoritative check instead: server-to-server
 * (no CORS involved), it asks Drive directly whether a file matching this
 * registration exists in its folder, using the deterministic
 * `${registrationCode} - ...` name /api/video/session assigned it.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { registrationCode, categoryId, eventName } = (json ?? {}) as Record<string, unknown>;
  if (
    typeof registrationCode !== "number" ||
    typeof categoryId !== "string" ||
    typeof eventName !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const category = getFestCategory(categoryId);
  if (!category) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Video upload isn't available right now." },
      { status: 500 },
    );
  }

  const { data: row, error: lookupError } = await supabase
    .from("registrations")
    .select("video_drive_file_id")
    .eq("registration_code", registrationCode)
    .eq("category_name", category.name)
    .eq("event_name", eventName)
    .maybeSingle();

  if (lookupError || !row) {
    return NextResponse.json({ error: "We couldn't find that registration." }, { status: 404 });
  }
  if (row.video_drive_file_id) {
    // Already linked — a retried /complete call is a no-op, not an error.
    return NextResponse.json({ ok: true });
  }

  const content = await getSiteContent();
  const folderId = content.videoUploadFolders[`${categoryId}::${eventName}`];
  if (!folderId) {
    console.error(`No Drive folder configured for "${categoryId}::${eventName}".`);
    return NextResponse.json(
      { error: "This event isn't set up for video upload yet. Please contact us." },
      { status: 500 },
    );
  }

  let driveFileId: string | null;
  try {
    driveFileId = await findLatestFileByPrefix(folderId, `${registrationCode} - `);
  } catch (err) {
    console.error("Drive file search failed:", err);
    return NextResponse.json(
      { error: "We couldn't confirm your upload. Please try again." },
      { status: 500 },
    );
  }
  if (!driveFileId) {
    return NextResponse.json(
      { error: "We couldn't confirm your upload reached Drive. Please try again." },
      { status: 404 },
    );
  }

  const { error: updateError } = await supabase
    .from("registrations")
    .update({ video_drive_file_id: driveFileId, video_uploaded_at: new Date().toISOString() })
    .eq("registration_code", registrationCode)
    .is("video_drive_file_id", null);

  if (updateError) {
    console.error("Linking video to registration failed:", updateError.message);
    return NextResponse.json(
      {
        error:
          "The video uploaded, but we couldn't record it. Please contact us with your registration number.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
