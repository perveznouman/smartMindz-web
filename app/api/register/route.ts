import { NextResponse } from "next/server";
import { registrationSchema, normalizeWhatsapp } from "@/lib/validation/registration";
import { getServiceClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/data";
import { getFestCategory } from "@/lib/data/festEvents";
import { getJoinLink, sendConfirmation } from "@/lib/notify/whatsapp";

export const dynamic = "force-dynamic";

/**
 * POST /api/register
 * Validates the submission (same zod schema as the client), persists it to
 * Supabase via the service-role client, fires the (pluggable) WhatsApp
 * confirmation, and returns the group/join link for the success screen.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const content = await getSiteContent();

  // The submitted event is the competition name; use it directly.
  const eventTitle = data.event || "your event";
  const categoryName = getFestCategory(data.categoryId)?.name ?? data.categoryId;

  const whatsapp = normalizeWhatsapp(data.whatsapp);
  const supabase = getServiceClient();

  let persisted = false;
  let registrationId: string | null = null;
  if (supabase) {
    // category_id / event_id are legacy FK columns; the fest cascade stores
    // human-readable values in the text columns instead (see the migration in
    // content/registration-fest.sql).
    const { data: inserted, error } = await supabase
      .from("registrations")
      .insert({
        full_name: data.fullName,
        category_name: categoryName,
        class_year: data.classYear,
        institution: data.institution || null,
        whatsapp,
        event_name: data.event,
        city: data.city,
      })
      .select("id")
      .single();
    if (error) {
      console.error("Registration insert failed:", error.message);
      return NextResponse.json(
        { error: "We couldn't save your registration. Please try again." },
        { status: 500 },
      );
    }
    persisted = true;
    registrationId = inserted?.id ?? null;
  } else {
    // No service key configured (e.g. local dev). Don't block the demo flow.
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set — registration not persisted.");
  }

  await sendConfirmation({ fullName: data.fullName, whatsapp, eventTitle });

  return NextResponse.json({
    ok: true,
    persisted,
    registrationId,
    fullName: data.fullName,
    eventTitle,
    joinLink: getJoinLink(content),
    contact: content.whatsappContact,
  });
}
