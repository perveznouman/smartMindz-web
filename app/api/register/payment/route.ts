import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { supabaseBucket } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

/**
 * POST /api/register/payment  (multipart/form-data)
 *
 * Fields: `file` (the payment screenshot) and `registrationId` (from the
 * /api/register response). Uploads the file to Supabase Storage under the
 * `payments/` prefix and links its public URL to the registration row.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  const registrationId = form.get("registrationId");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Please choose your payment screenshot." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That file is too large (max 5 MB)." },
      { status: 400 },
    );
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Upload an image (JPG, PNG, WEBP) or PDF." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  if (!supabase) {
    // Local dev without a service key — accept but don't persist, so the
    // flow can still be demonstrated end-to-end.
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set — payment screenshot not stored.");
    return NextResponse.json({ ok: true, persisted: false, url: null });
  }

  const ext =
    (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const idPart =
    typeof registrationId === "string" && registrationId ? registrationId : "unlinked";
  const path = `payments/${idPart}-${Date.now()}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(supabaseBucket)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadError) {
    console.error("Payment upload failed:", uploadError.message);
    return NextResponse.json(
      { error: "We couldn't upload your screenshot. Please try again." },
      { status: 500 },
    );
  }

  const { data: pub } = supabase.storage.from(supabaseBucket).getPublicUrl(path);
  const url = pub?.publicUrl ?? null;

  // Best-effort: link the screenshot to the registration record.
  if (typeof registrationId === "string" && registrationId) {
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ payment_url: url })
      .eq("id", registrationId);
    if (updateError) {
      console.error("Linking payment to registration failed:", updateError.message);
    }
  }

  return NextResponse.json({ ok: true, persisted: true, url });
}
