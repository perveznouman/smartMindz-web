import { NextResponse } from "next/server";
import { getEvents } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * GET /api/events            -> all upcoming events (each with categoryIds)
 * GET /api/events?category=X -> only upcoming events open to category X
 *
 * Powers the dependent Event dropdown in the registration form.
 */
export async function GET(request: Request) {
  const events = await getEvents();
  const upcoming = events.filter((e) => e.status === "upcoming");

  const category = new URL(request.url).searchParams.get("category");
  const result = category
    ? upcoming.filter((e) => e.categoryIds.includes(category))
    : upcoming;

  return NextResponse.json({
    events: result.map((e) => ({
      id: e.id,
      title: e.title,
      categoryIds: e.categoryIds,
    })),
  });
}
