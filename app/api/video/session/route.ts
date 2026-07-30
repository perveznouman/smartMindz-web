import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/data";
import { isVideoUploadOpen } from "@/lib/utils";
import { findVideoRegistration } from "@/lib/data/videoRegistrations";
import { createResumableUploadSession } from "@/lib/google/drive";

export const dynamic = "force-dynamic";

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB — soft cap, raise if needed.

/**
 * Validated on extension rather than MIME type. Browsers report video MIME
 * types inconsistently — Android often sends application/octet-stream, and
 * plenty of real phone videos arrive as types outside any short allow-list.
 * The extension is what actually decides whether a judge can play the file,
 * and whitelisting it also stops an arbitrary client-supplied suffix ending
 * up in the Drive filename (see driveFileName below).
 */
const ALLOWED_EXTENSIONS = [
  ".mp4",
  ".m4v",
  ".mov",
  ".webm",
  ".mkv",
  ".avi",
  ".3gp",
  ".3g2",
  ".mpeg",
  ".mpg",
  ".ogv",
];

/**
 * Only forward an Origin we know is our own page. Google echoes whatever it
 * gets into the upload session's Access-Control-Allow-Origin, so this stays
 * same-origin-only rather than relaying an arbitrary client-supplied value.
 * Returns undefined when it doesn't match, which degrades to the old
 * no-CORS behaviour that /api/video/complete already covers.
 */
function sameOrigin(request: Request): string | undefined {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return undefined;
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return origin === `${proto}://${host}` ? origin : undefined;
}

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

  const dot = fileName.lastIndexOf(".");
  const ext = dot > 0 ? fileName.slice(dot).toLowerCase() : "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: "That file type isn't supported. Upload an MP4, MOV, WEBM, MKV or AVI video." },
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
  // "IMG_1234.mp4"). `ext` is whitelisted above.
  const safeName = result.row.full_name.replace(/[\\/:*?"<>|]+/g, " ").trim();
  const driveFileName = `${registrationCode} - ${safeName}${ext}`;

  try {
    const uploadUrl = await createResumableUploadSession({
      folderId,
      fileName: driveFileName,
      // Browser-reported MIME is unreliable (see ALLOWED_EXTENSIONS); fall
      // back to a generic video type rather than storing octet-stream.
      mimeType: mimeType.startsWith("video/") ? mimeType : "video/mp4",
      fileSize,
      origin: sameOrigin(request),
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
