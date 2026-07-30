import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/data";
import { getFestCategory } from "@/lib/data/festEvents";
import { findLatestFileByPrefix, verifyFileInFolder } from "@/lib/google/drive";

export const dynamic = "force-dynamic";

/**
 * POST /api/video/complete
 * Step 3 — links the uploaded Drive file to the registration.
 *
 * Prefers the `driveFileId` the browser read back from its own upload, but
 * never trusts it blind: it's checked to be in this event's folder and to
 * carry our `${registrationCode} - ` name before being stored. When the
 * browser couldn't read the id at all — an upload can land on Drive while
 * the response stays unreadable, e.g. from an in-app browser — the server
 * falls back to searching the folder itself.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { registrationCode, categoryId, eventName, driveFileId: claimedFileId } =
    (json ?? {}) as Record<string, unknown>;
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

  const namePrefix = `${registrationCode} - `;
  let driveFileId: string | null = null;
  try {
    if (typeof claimedFileId === "string" && claimedFileId) {
      driveFileId = await verifyFileInFolder(claimedFileId, folderId, namePrefix);
    }
    // No id from the browser, or it didn't check out — search the folder.
    if (!driveFileId) {
      driveFileId = await findLatestFileByPrefix(folderId, namePrefix);
    }
  } catch (err) {
    console.error("Drive file lookup failed:", err);
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
