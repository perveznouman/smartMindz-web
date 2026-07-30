import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/data";
import { isVideoUploadOpen } from "@/lib/utils";
import { findVideoRegistration } from "@/lib/data/videoRegistrations";

export const dynamic = "force-dynamic";

/**
 * POST /api/video/verify
 * Step 1 of the video-upload flow: confirms the 4-digit registration number
 * belongs to a registration for the chosen category + online event, and that
 * it hasn't already received a video. This alone is not trusted for the
 * actual upload — /api/video/session re-runs the same check.
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

  return NextResponse.json({ ok: true, fullName: result.row.full_name });
}
