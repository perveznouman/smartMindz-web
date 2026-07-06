/**
 * Independence Fest '27 — registration data.
 *
 * This is the SINGLE SOURCE OF TRUTH for the registration cascade:
 *   Category  ->  Events (competitions)  +  Class/Year options
 *
 * Both the Event dropdown and the Class/Year dropdown are filtered by the
 * selected Category. To add/edit a competition, a class, or a whole category,
 * edit this one file — the form updates automatically.
 */

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

export const festCategories: FestCategory[] = [
  {
    id: "category-1",
    name: "Category 1",
    events: ["Fancy Dress (Online)", "Rhymes Recitation (Online)", "Colouring (Offline)"],
    classYears: ["Pre KG", "LKG", "UKG"],
  },
  {
    id: "category-2",
    name: "Category 2",
    events: [
      "Show & Tell (Online)",
      "Rhymes Recitation (Online)",
      "Colouring (Offline)",
    ],
    classYears: ["1st", "2nd", "3rd"],
  },
  {
    id: "category-3",
    name: "Category 3",
    events: [
      "Handwriting (Offline)",
      "Drawing (Offline)",
      "Speech (Offline)",
      "Best out of Waste (Online)",
    ],
    classYears: ["4th", "5th"],
  },
  {
    id: "category-4",
    name: "Category 4",
    events: [
      "Drawing (Offline)",
      "Speech (Offline)",
      "Essay Writing (Online)",
      "Best out of Waste",
    ],
    classYears: ["6th", "7th", "8th"],
  },
  {
    id: "category-5",
    name: "Category 5",
    events: [
      "Poster Presentation (Offline)",
      "Essay Writing (Online)",
      "Speech (Offline)",
      "Short Film (Online)",
    ],
    classYears: ["9th", "10th", "11th", "12th"],
  },
  {
    id: "category-6",
    name: "Category 6",
    events: [
      "Poster Presentation (Offline)",
      "Speech (Offline)",
      "Debate (Offline)",
      "Calligraphy (Offline)",
      "Short Film (Online)",
    ],
    classYears: [
      "Diploma 1st",
      "Diploma 2nd",
      "Diploma 3rd",
      "UG 1st",
      "UG 2nd",
      "UG 3rd",
      "PG 1st",
      "PG 2nd",
    ],
  },
  {
    id: "category-7",
    name: "Category 7",
    events: [
      "Speech (Offline)",
      "Poster Presentation (Offline)",
      "Calligraphy (Offline)",
      "Quiz (Offline)",
    ],
    classYears: ["Open Category"],
  },
];

/** Look up a category by its id. */
export function getFestCategory(id: string): FestCategory | undefined {
  return festCategories.find((c) => c.id === id);
}
