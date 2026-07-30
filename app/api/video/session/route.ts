import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/data";
import { isVideoUploadOpen } from "@/lib/utils";
import { findVideoRegistration } from "@/lib/data/videoRegistrations";
import { createResumableUploadSession } from "@/lib/google/drive";

export const dynamic = "force-dynamic";

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB — soft cap, raise if needed.
const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/3gpp",
];

/**
 * POST /api/video/session
 * Step 2: re-validates the code (never trust the earlier /verify call
 * alone), looks up the Drive folder configured for this event, and opens a
 * resumable upload session with Google. Returns the session URL so the
 * browser can PUT the file bytes straight to Drive — our server is never in
 * the data path, so there's no request-body size ceiling to worry about.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { registrationCode, categoryId, eventName, fileName, fileSize, mimeType } =
    (json ?? {}) as Record<string, unknown>;
  if (
    typeof registrationCode !== "number" ||
    typeof categoryId !== "string" ||
    typeof eventName !== "string" ||
    typeof fileName !== "string" ||
    typeof fileSize !== "number" ||
    typeof mimeType !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (fileSize <= 0 || fileSize > MAX_BYTES) {
    return NextResponse.json({ error: "That video is too large (max 500 MB)." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: "Upload an MP4, MOV, WEBM or MKV video." },
      { status: 400 },
    );
  }

  const content = await getSiteContent();
  if (!isVideoUploadOpen(content)) {
    return NextResponse.json({ error: "Video upload is currently closed." }, { status: 403 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Video upload isn't available right now." },
      { status: 500 },
    );
  }

  const result = await findVideoRegistration(supabase, {
    registrationCode,
    categoryId,
    eventName,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Keyed by category + event, not event name alone — some event names
  // (e.g. "Fancy Dress (Online)") repeat across categories and need separate
  // folders per category. See lib/types.ts SiteContent.videoUploadFolders.
  const folderKey = `${categoryId}::${eventName}`;
  const folderId = content.videoUploadFolders[folderKey];
  if (!folderId) {
    console.error(`No Drive folder configured for "${folderKey}".`);
    return NextResponse.json(
      { error: "This event isn't set up for video upload yet. Please contact us." },
      { status: 500 },
    );
  }

  // Named by registration code, not the participant's raw filename — makes
  // the Drive folder searchable/sortable by code, and avoids trusting
  // whatever name the browser sent (could be blank, or unhelpful like
  // "IMG_1234.mp4").
  const ext = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";
  const safeName = result.row.full_name.replace(/[\\/:*?"<>|]+/g, " ").trim();
  const driveFileName = `${registrationCode} - ${safeName}${ext}`;

  try {
    const uploadUrl = await createResumableUploadSession({
      folderId,
      fileName: driveFileName,
      mimeType,
      fileSize,
    });
    return NextResponse.json({ ok: true, uploadUrl });
  } catch (err) {
    console.error("Drive session creation failed:", err);
    return NextResponse.json(
      { error: "We couldn't start the upload. Please try again." },
      { status: 500 },
    );
  }
}
