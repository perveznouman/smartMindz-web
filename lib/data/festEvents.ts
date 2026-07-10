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
