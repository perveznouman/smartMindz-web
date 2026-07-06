/**
 * SmartMindz — Color management utility.
 *
 * This is the SINGLE SOURCE OF TRUTH for the brand palette. Every color used by
 * the site is a semantic token defined here with a `light` and `dark` value.
 *
 * How it flows through the app:
 *   1. `ColorManager.cssVariables()` emits `:root { --c-*: R G B }` and
 *      `.dark { --c-*: R G B }` blocks. These are injected once in the root
 *      layout (see app/layout.tsx) so there is no theme flash on load.
 *   2. tailwind.config.ts maps utilities (`bg-brand`, `text-content`, ...) to
 *      those variables via `rgb(var(--c-*) / <alpha-value>)`.
 *   3. next-themes toggles the `.dark` class on <html>, swapping the values.
 *
 * To re-skin the entire site, edit the values below. Nothing else needs to change.
 *
 * Values are stored as space-separated RGB triplets ("255 122 26") so Tailwind's
 * opacity modifiers (e.g. `bg-brand/20`) keep working.
 */

export type ThemeMode = "light" | "dark";

/** A semantic color token with a value per theme mode. */
type Token = { light: string; dark: string };

/**
 * Semantic tokens. Names describe ROLE, not hue, so swapping the palette never
 * requires renaming usages across the codebase.
 */
export const palette = {
  /** Primary brand color — vibrant blue. Headlines, accents, premium elements. */
  "brand": { light: "37 99 235", dark: "96 165 250" },
  /** Readable foreground on top of `brand`. */
  "brand-fg": { light: "255 255 255", dark: "23 20 16" },

  /** Secondary accent — cool blue. Highlights, secondary CTAs. */
  "accent": { light: "100 127 204", dark: "147 197 253" },
  /** Readable foreground on top of `accent`. */
  "accent-fg": { light: "255 255 255", dark: "23 20 16" },

  /** Tertiary highlight — emerald (patriotic). */
  "highlight": { light: "5 150 105", dark: "16 185 129" },

  /** Page background (soft off-white). */
  "bg": { light: "242 242 247", dark: "8 8 10" },
  /** Glass card / panel background (semi-transparent). */
  "surface": { light: "255 255 255", dark: "30 30 35" },
  /** Elevated glass surface (slightly higher opacity). */
  "surface-2": { light: "240 240 240", dark: "45 45 52" },
  /** Hairline borders & dividers. */
  "border": { light: "220 218 210", dark: "70 70 80" },

  /** Primary text (refined). */
  "text": { light: "18 18 22", dark: "240 240 245" },
  /** Muted / secondary text. */
  "text-muted": { light: "120 118 110", dark: "160 160 170" },

  /** Status colors. */
  "success": { light: "5 150 105", dark: "16 185 129" },
  "danger": { light: "220 38 38", dark: "248 113 113" },
} satisfies Record<string, Token>;

export type ColorToken = keyof typeof palette;

/**
 * ColorManager — small utility class for working with the palette in JS/CSS.
 * Most components should just use Tailwind classes (e.g. `bg-brand`); reach for
 * this when you need a raw value (canvas, charts, meta theme-color, inline SVG).
 */
class ColorManagerImpl {
  readonly tokens = palette;

  /** RGB triplet ("234 88 12") for a token in a given mode. */
  rgbTriplet(token: ColorToken, mode: ThemeMode = "light"): string {
    return palette[token][mode];
  }

  /** A usable CSS color, e.g. `rgb(234 88 12 / 0.5)`. */
  rgb(token: ColorToken, mode: ThemeMode = "light", alpha = 1): string {
    const triplet = this.rgbTriplet(token, mode);
    return alpha >= 1 ? `rgb(${triplet})` : `rgb(${triplet} / ${alpha})`;
  }

  /** Reference the live CSS variable (respects the current theme). */
  cssVar(token: ColorToken, alpha = 1): string {
    return alpha >= 1
      ? `rgb(var(--c-${token}))`
      : `rgb(var(--c-${token}) / ${alpha})`;
  }

  /** Build the `--c-*` declarations for one mode. */
  private declarations(mode: ThemeMode): string {
    return (Object.keys(palette) as ColorToken[])
      .map((token) => `--c-${token}: ${palette[token][mode]};`)
      .join(" ");
  }

  /**
   * Full CSS to inject in the document so Tailwind's variable-based colors
   * resolve. Includes light (`:root`) and dark (`.dark`) blocks.
   */
  cssVariables(): string {
    return `:root { ${this.declarations("light")} }\n.dark { ${this.declarations("dark")} }`;
  }

  /** Browser address-bar / PWA theme color for a mode. */
  themeColorMeta(mode: ThemeMode): string {
    return this.rgb("bg", mode);
  }
}

export const ColorManager = new ColorManagerImpl();
