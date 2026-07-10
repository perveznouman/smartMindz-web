/**
 * Countries for WhatsApp registration field.
 *
 * Imports from registration-data.json. To add more countries, edit that file:
 * just add a new entry to the `countries` array with code, name, flag, dial, and digits.
 *
 * No code changes needed — the form and validation update automatically.
 */

import registrationData from "./registration-data.json";

export interface Country {
  /** ISO 3166-1 alpha-2 code. Used as the stored value. */
  code: string;
  name: string;
  flag: string;
  /** Dial code without the leading +. */
  dial: string;
  /** Expected length of the local number. */
  digits: number;
}

export const COUNTRIES: readonly Country[] = registrationData.countries;

export const DEFAULT_COUNTRY_CODE = "IN";

const BY_CODE: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
);

export function getCountry(code: string): Country | undefined {
  return BY_CODE[code];
}

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code);
