/**
 * One-time (re-runnable) gallery uploader.
 *
 *   npm run upload-gallery                 # uploads ./Photos and ./WPhotos
 *   npm run upload-gallery -- ./Photos     # upload a specific folder
 *   npm run upload-gallery -- ./Photos evt-republic-fest-2025   # tag an event
 *
 * For each source image it generates a compressed full image + a thumbnail
 * (WebP), uploads both to the Supabase Storage bucket, and inserts a row into
 * `gallery_photos`. Uploads use a deterministic path so re-running is safe
 * (upsert) and won't duplicate storage objects.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "smartmindz";

if (!URL || !KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"]);

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw error;
    console.log(`Created public bucket "${BUCKET}".`);
  }
}

async function processOne(dir: string, file: string, eventId: string | null, order: number) {
  const srcPath = join(dir, file);
  const id = `${basename(dir)}-${basename(file, extname(file))}`.replace(/[^a-zA-Z0-9_-]/g, "_");

  const input = sharp(srcPath).rotate(); // respect EXIF orientation
  const full = await input.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const thumb = await input.clone().resize({ width: 600, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();

  const fullPath = `gallery/full/${id}.webp`;
  const thumbPath = `gallery/thumb/${id}.webp`;

  for (const [path, buf] of [[fullPath, full], [thumbPath, thumb]] as const) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: "image/webp", upsert: true });
    if (error) throw error;
  }

  const url = supabase.storage.from(BUCKET).getPublicUrl(fullPath).data.publicUrl;
  const thumbUrl = supabase.storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl;

  // Deterministic primary key so re-runs upsert instead of duplicating.
  const { error: dbErr } = await supabase.from("gallery_photos").upsert(
    {
      id,
      url,
      thumb_url: thumbUrl,
      caption: null,
      event_id: eventId,
      sort_order: order,
    },
    { onConflict: "id" },
  );
  if (dbErr) throw dbErr;
}

async function uploadFolder(dir: string, eventId: string | null) {
  let files: string[];
  try {
    files = (await readdir(dir)).filter((f) => IMAGE_EXT.has(extname(f)));
  } catch {
    console.warn(`Skipping ${dir} (not found).`);
    return 0;
  }
  files.sort();
  console.log(`\n${dir}: ${files.length} images`);

  let done = 0;
  for (const file of files) {
    try {
      await processOne(dir, file, eventId, done);
      done++;
      if (done % 25 === 0 || done === files.length) {
        process.stdout.write(`  ${done}/${files.length}\r`);
      }
    } catch (e) {
      console.error(`  ! ${file}:`, (e as Error).message);
    }
  }
  console.log(`  done: ${done}/${files.length}`);
  return done;
}

async function main() {
  await ensureBucket();

  const args = process.argv.slice(2);
  const explicitDir = args[0];
  const eventId = args[1] ?? null;

  const dirs = explicitDir ? [explicitDir] : ["Photos", "WPhotos"];
  let total = 0;
  for (const dir of dirs) total += await uploadFolder(dir, eventId);

  console.log(`\n✅ Uploaded ${total} photos to bucket "${BUCKET}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
