/**
 * Independence Fest — registration categories, events, and class/year options.
 *
 * Imports from registration-data.json. To add/edit categories, events, or classes,
 * edit that JSON file directly — no TypeScript syntax required.
 *
 * The cascade works like this:
 *   Category  ->  Events (competitions)  +  Class/Year options
 *
 * Both the Event dropdown and the Class/Year dropdown are filtered by the
 * selected Category.
 */

import registrationData from "./registration-data.json";

export interface FestCategory {
  /** Stable id used as the form value + stored on the registration. */
  id: string;
  /** Display label shown in the Category dropdown. */
  name: string;
  /** Competitions open to this category (Event dropdown). */
  events: string[];
  /** Class / Year options for this category (Class/Year dropdown). */
  classYears: string[];
}

export const festCategories: FestCategory[] = registrationData.festCategories;

/** Look up a category by its id. */
export function getFestCategory(id: string): FestCategory | undefined {
  return festCategories.find((c) => c.id === id);
}

/** This category's events that are run online (name ends "(Online)") — the
 * only ones eligible for video upload. Offline events (judged in person)
 * have nothing to upload. */
export function getOnlineEvents(categoryId: string): string[] {
  return (getFestCategory(categoryId)?.events ?? []).filter((e) =>
    e.includes("(Online)"),
  );
}

/** The `events.id` this registration cascade (and the video-upload feature)
 * belongs to — currently there is only ever one live fest. When the next
 * fest launches, this id, registration-data.json and content/seed.sql all
 * need updating together. */
export const FEST_EVENT_ID = "evt-independce-fest-2026";
