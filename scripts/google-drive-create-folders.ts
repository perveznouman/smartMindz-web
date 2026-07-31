/**
 * One-time setup: creates one Google Drive folder per (category, online
 * event) pair (see lib/data/festEvents.ts / lib/data/registration-data.json),
 * inside a new root "SmartMindz Video Uploads" folder, using the credentials
 * obtained from google-drive-authorize.ts.
 *
 * A folder per *pair*, not per event name, because some event names repeat
 * across categories (e.g. "Fancy Dress (Online)" is both category-1 and
 * category-2, different age groups) and need separate folders. Where a name
 * repeats, the folder is suffixed with the category so it's still readable
 * in the Drive UI, e.g. "Fancy Dress (Online) — Category 1".
 *
 * Run once, after google-drive-authorize.ts:
 *   npx tsx scripts/google-drive-create-folders.ts
 *
 * Prints a `videoUploadFolders` JSON blob mapping `${categoryId}::${eventName}`
 * to its new Drive folder id — paste that into the `videoUploadFolders` row
 * in Supabase `site_content` (staging first, then production), then flip
 * `videoUploadEnabled` to true once you're ready to go live.
 *
 * Re-running creates a second root folder with a fresh set of folder ids
 * rather than reusing the first (the drive.file scope only lets this app see
 * folders it created, so it can't detect "already exists"). This script is
 * meant to run once — only re-run if you actually want a clean new set.
 */
import { config } from "dotenv";
import { festCategories } from "../lib/data/festEvents";

config({ path: ".env.local" });

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error(
    "Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN " +
      "in .env.local. Run `npx tsx scripts/google-drive-authorize.ts` first.",
  );
  process.exit(1);
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      refresh_token: REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string,
): Promise<string> {
  const res = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    }),
  });
  if (!res.ok) {
    throw new Error(`Folder creation failed for "${name}": ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function main() {
  const pairs = festCategories.flatMap((c) =>
    c.events
      .filter((e) => e.includes("(Online)"))
      .map((eventName) => ({ categoryId: c.id, categoryName: c.name, eventName })),
  );

  if (pairs.length === 0) {
    console.error("No online events found in lib/data/registration-data.json.");
    process.exit(1);
  }

  // Event names that appear under more than one category need the category
  // appended to their folder name so they're distinguishable in the Drive UI.
  const eventNameCounts = new Map<string, number>();
  for (const { eventName } of pairs) {
    eventNameCounts.set(eventName, (eventNameCounts.get(eventName) ?? 0) + 1);
  }

  console.log(`Creating folders for ${pairs.length} category/event pairs...\n`);

  const accessToken = await getAccessToken();
  const rootId = await createFolder(accessToken, "SmartMindz Video Uploads");
  console.log(`Root folder: SmartMindz Video Uploads (${rootId})`);

  const mapping: Record<string, string> = {};
  for (const { categoryId, categoryName, eventName } of pairs) {
    const needsDisambiguation = (eventNameCounts.get(eventName) ?? 0) > 1;
    const folderName = needsDisambiguation ? `${eventName} — ${categoryName}` : eventName;
    const folderId = await createFolder(accessToken, folderName, rootId);
    const key = `${categoryId}::${eventName}`;
    mapping[key] = folderId;
    console.log(`  ${folderName}  (${key}) -> ${folderId}`);
  }

  console.log("\nPaste this into the `videoUploadFolders` row in Supabase `site_content`:\n");
  console.log(JSON.stringify(mapping, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
