/**
 * Shared domain types. These are framework-agnostic and can be reused by a
 * future React Native / Expo app that talks to the same Supabase backend.
 */

export type EventStatus = "upcoming" | "past";

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  eventDate: string | null; // ISO date
  location: string | null;
  status: EventStatus;
  coverUrl: string | null;
  /** Category ids this event is open to (drives the dependent dropdown). */
  categoryIds: string[];
  registrationOpen: boolean;
  registrationClosesAt: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string | null;
  sortOrder: number;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  thumbUrl: string | null;
  caption: string | null;
  eventId: string | null;
  sortOrder: number;
}

/** A single downloadable/viewable attachment on an event — a rule sheet, a
 * results PDF, a scoresheet, etc. `kind` groups them into sections on the
 * event page; each section supports any number of attachments. */
export interface EventResult {
  id: string;
  eventId: string;
  kind: "rule" | "result";
  title: string;
  body: string | null;
  fileUrl: string | null;
}

export interface SocialLink {
  label: string;
  href: string;
  handle?: string;
}

/** Editable site-wide content. Backed by the `site_content` key/value table. */
export interface SiteContent {
  orgName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  mission: string;
  aboutStory: string[];
  aboutHighlights: { title: string; body: string }[];
  logoUrl: string | null;
  location: string;
  languages: string[];
  rewards: string[];
  stats: { value: string; label: string }[];
  instagram: SocialLink;
  youtube: SocialLink;
  whatsappContact: string;
  whatsappGroupLink: string;
  email: string | null;
}

export interface RegistrationInput {
  fullName: string;
  categoryId: string;
  classYear: string;
  institution: string;
  whatsapp: string;
  event: string;
  city: string;
}
