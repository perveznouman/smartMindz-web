import "server-only";
import { cache } from "react";
import { getServerReadClient } from "@/lib/supabase/server";
import {
  fallbackCategories,
  fallbackEvents,
  fallbackGallery,
  fallbackSiteContent,
  fallbackTeam,
} from "@/lib/content/fallback";
import type {
  Category,
  EventItem,
  EventResult,
  GalleryPhoto,
  SiteContent,
  TeamMember,
} from "@/lib/types";

/**
 * Data access layer.
 *
 * Every getter tries Supabase first and transparently falls back to the
 * built-in content in lib/content/fallback.ts when Supabase is not configured
 * or a query fails. This keeps the site fully functional offline and makes the
 * DB the source of truth once connected. Results are request-memoised via
 * React `cache`.
 */

// ---- row -> domain mappers -------------------------------------------------

type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  status: string;
  cover_url: string | null;
};

function mapEvent(row: EventRow): EventItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    eventDate: row.event_date,
    location: row.location,
    status: row.status === "past" ? "past" : "upcoming",
    coverUrl: row.cover_url,
    categoryIds: [],
  };
}

// ---- getters ---------------------------------------------------------------

/**
 * Supabase `site_content` values are free-form JSON, so a value edited in the
 * dashboard can arrive in the wrong shape (e.g. `aboutStory` saved as a single
 * string instead of an array of paragraphs). Coerce the array-typed fields so
 * pages that `.map()` over them never crash at build/runtime, falling back to
 * the defaults when a value is unusable.
 */
function normalizeSiteContent(merged: Record<string, unknown>): SiteContent {
  const asArray = <T,>(value: unknown, fallback: T[]): T[] =>
    Array.isArray(value) ? (value as T[]) : fallback;

  let aboutStory = merged.aboutStory;
  if (typeof aboutStory === "string") {
    // A single string → split into paragraphs on blank lines.
    aboutStory = aboutStory
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(aboutStory) || aboutStory.length === 0) {
    aboutStory = fallbackSiteContent.aboutStory;
  }

  return {
    ...(merged as unknown as SiteContent),
    aboutStory: aboutStory as string[],
    aboutHighlights: asArray(merged.aboutHighlights, fallbackSiteContent.aboutHighlights),
    languages: asArray(merged.languages, fallbackSiteContent.languages),
    rewards: asArray(merged.rewards, fallbackSiteContent.rewards),
    stats: asArray(merged.stats, fallbackSiteContent.stats),
    registrationOpen:
      typeof merged.registrationOpen === "boolean"
        ? merged.registrationOpen
        : fallbackSiteContent.registrationOpen,
    registrationClosesAt:
      typeof merged.registrationClosesAt === "string" ? merged.registrationClosesAt : null,
    paymentAmount:
      typeof merged.paymentAmount === "number"
        ? merged.paymentAmount
        : fallbackSiteContent.paymentAmount,
    paymentUpiId:
      typeof merged.paymentUpiId === "string" && merged.paymentUpiId
        ? merged.paymentUpiId
        : fallbackSiteContent.paymentUpiId,
    paymentPayeeName:
      typeof merged.paymentPayeeName === "string" && merged.paymentPayeeName
        ? merged.paymentPayeeName
        : fallbackSiteContent.paymentPayeeName,
    paymentNote:
      typeof merged.paymentNote === "string" && merged.paymentNote
        ? merged.paymentNote
        : fallbackSiteContent.paymentNote,
    secondaryPhone:
      typeof merged.secondaryPhone === "string" && merged.secondaryPhone
        ? merged.secondaryPhone
        : fallbackSiteContent.secondaryPhone,
    secondaryEmail:
      typeof merged.secondaryEmail === "string" && merged.secondaryEmail
        ? merged.secondaryEmail
        : fallbackSiteContent.secondaryEmail,
  };
}

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const supabase = getServerReadClient();
  if (!supabase) return fallbackSiteContent;

  const { data, error } = await supabase
    .from("site_content")
    .select("key, value");
  if (error || !data) return fallbackSiteContent;

  // Merge DB key/value pairs over the defaults so missing keys stay populated.
  const overrides = Object.fromEntries(
    data.map((row: { key: string; value: unknown }) => [row.key, row.value]),
  );
  return normalizeSiteContent({ ...fallbackSiteContent, ...overrides });
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = getServerReadClient();
  if (!supabase) return fallbackCategories;

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order");
  if (error || !data) return fallbackCategories;

  return data.map((r: { id: string; name: string; sort_order: number }) => ({
    id: r.id,
    name: r.name,
    sortOrder: r.sort_order,
  }));
});

const EVENT_SELECT =
  "id, slug, title, description, event_date, location, status, cover_url";

export const getEvents = cache(async (): Promise<EventItem[]> => {
  const supabase = getServerReadClient();
  if (!supabase) return fallbackEvents;

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .order("event_date", { ascending: false });
  if (error || !data) return fallbackEvents;

  return (data as EventRow[]).map(mapEvent);
});

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  const supabase = getServerReadClient();
  if (!supabase) return fallbackEvents.find((e) => e.slug === slug) ?? null;

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return fallbackEvents.find((e) => e.slug === slug) ?? null;

  return mapEvent(data as EventRow);
}

/** Events open to a given category — powers the dependent dropdown. */
export async function getEventsByCategory(
  categoryId: string,
): Promise<EventItem[]> {
  const all = await getEvents();
  return all.filter(
    (e) => e.status === "upcoming" && e.categoryIds.includes(categoryId),
  );
}

export const getTeam = cache(async (): Promise<TeamMember[]> => {
  const supabase = getServerReadClient();
  if (!supabase) return fallbackTeam;

  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, role, photo_url, sort_order")
    .order("sort_order");
  if (error || !data) return fallbackTeam;

  return data.map(
    (r: {
      id: string;
      name: string;
      role: string;
      photo_url: string | null;
      sort_order: number;
    }) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      photoUrl: r.photo_url,
      sortOrder: r.sort_order,
    }),
  );
});

export async function getGallery(eventId?: string): Promise<GalleryPhoto[]> {
  const supabase = getServerReadClient();
  if (!supabase) {
    return eventId
      ? fallbackGallery.filter((p) => p.eventId === eventId)
      : fallbackGallery;
  }

  let query = supabase
    .from("gallery_photos")
    .select("id, url, thumb_url, caption, event_id, sort_order")
    .order("sort_order");
  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error || !data) return eventId ? [] : fallbackGallery;

  return data.map(
    (r: {
      id: string;
      url: string;
      thumb_url: string | null;
      caption: string | null;
      event_id: string | null;
      sort_order: number;
    }) => ({
      id: r.id,
      url: r.url,
      thumbUrl: r.thumb_url,
      caption: r.caption,
      eventId: r.event_id,
      sortOrder: r.sort_order,
    }),
  );
}

export async function getResults(eventId: string): Promise<EventResult[]> {
  const supabase = getServerReadClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("results")
    .select("id, event_id, kind, title, body, file_url")
    .eq("event_id", eventId)
    .order("kind");
  if (error || !data) return [];

  return data.map(
    (r: {
      id: string;
      event_id: string;
      kind: string;
      title: string;
      body: string | null;
      file_url: string | null;
    }) => ({
      id: r.id,
      eventId: r.event_id,
      kind: r.kind === "rule" ? "rule" : "result",
      title: r.title,
      body: r.body,
      fileUrl: r.file_url,
    }),
  );
}
