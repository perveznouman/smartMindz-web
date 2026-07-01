import { NextResponse } from "next/server";
import { registrationSchema, normalizeWhatsapp } from "@/lib/validation/registration";
import { getServiceClient } from "@/lib/supabase/server";
import { getEvents, getSiteContent } from "@/lib/data";
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

  // Resolve a friendly event title for the confirmation message.
  const events = await getEvents();
  const eventTitle =
    events.find((e) => e.id === data.eventId)?.title ?? "your event";

  const whatsapp = normalizeWhatsapp(data.whatsapp);
  const supabase = getServiceClient();

  let persisted = false;
  if (supabase) {
    const { error } = await supabase.from("registrations").insert({
      full_name: data.fullName,
      category_id: data.categoryId,
      institution: data.institution,
      whatsapp,
      event_id: data.eventId,
      city: data.city,
    });
    if (error) {
      console.error("Registration insert failed:", error.message);
      return NextResponse.json(
        { error: "We couldn't save your registration. Please try again." },
        { status: 500 },
      );
    }
    persisted = true;
  } else {
    // No service key configured (e.g. local dev). Don't block the demo flow.
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set — registration not persisted.");
  }

  await sendConfirmation({ fullName: data.fullName, whatsapp, eventTitle });

  return NextResponse.json({
    ok: true,
    persisted,
    eventTitle,
    joinLink: getJoinLink(content),
    contact: content.whatsappContact,
  });
}
