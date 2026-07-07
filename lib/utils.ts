/** Join class names, dropping falsy values. Lightweight clsx alternative. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Single source of truth for whether the site's Register buttons are live.
 * Controlled entirely from `site_content` in Supabase (registrationOpen /
 * registrationClosesAt) — no redeploy needed to open or close signups. */
export function isRegistrationOpen(content: {
  registrationOpen: boolean;
  registrationClosesAt: string | null;
}): boolean {
  if (!content.registrationOpen) return false;
  if (content.registrationClosesAt && new Date() >= new Date(content.registrationClosesAt)) {
    return false;
  }
  return true;
}

/** Format an ISO date into a friendly label, e.g. "26 Jan 2026". */
export function formatEventDate(iso: string | null): string {
  if (!iso) return "Date to be announced";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Deterministic colorful placeholder avatar URL for team members w/o photos. */
export function avatarPlaceholder(name: string): string {
  const params = new URLSearchParams({
    name,
    size: "256",
    background: "random",
    bold: "true",
    format: "png",
  });
  return `https://ui-avatars.com/api/?${params.toString()}`;
}
