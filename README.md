# SmartMindz

A fast, scalable, fully data-driven website for **SmartMindz** — *Where Every Talent Shines*.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS** and **Supabase**. Light/dark
mode, a dynamic event-registration form, and content you can edit without touching code.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

The site runs immediately with **built-in fallback content** (no database needed). Add Supabase
to persist registrations and edit content live (see below).

```bash
npm run build        # production build
npm start            # serve the production build
```

---

## How content & theming work

Everything is **data**, so nothing requires a code change to update:

| What you want to change | Where |
| --- | --- |
| Brand colors (light + dark) | [`lib/theme/colors.ts`](lib/theme/colors.ts) — single source of truth |
| About text, mission, socials, WhatsApp, logo | `site_content` table (or [`lib/content/fallback.ts`](lib/content/fallback.ts) before DB) |
| Events & which categories they're open to | `events` + `event_categories` tables |
| Team members | `team_members` table |
| Gallery photos | `gallery_photos` table + Storage (via the upload script) |

### Colors
All colors are **semantic tokens** in `lib/theme/colors.ts`. They are injected as CSS variables and
mapped to Tailwind utilities (`bg-brand`, `text-content`, etc.). Edit that one file to re-skin the
entire site, light and dark.

---

## Connecting Supabase (registrations + live content)

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy `.env.example` → `.env.local` and fill in (Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # keep secret — server only
   NEXT_PUBLIC_SUPABASE_BUCKET=smartmindz
   ```
3. In the Supabase **SQL Editor**, run [`content/seed.sql`](content/seed.sql). This creates all
   tables, Row-Level-Security policies, and seeds categories, events, team and site content.
4. Restart `npm run dev`. The site now reads from Supabase; registrations are saved to the
   `registrations` table.

**Security model:** the public (anon) key can only *read* content. Registrations are inserted
**server-side** with the service-role key in `app/api/register/route.ts`, so the browser can never
write to your database.

---

## Uploading the photo gallery

The repo ships with a small offline sample in `public/gallery/`. To publish the full set, compress
and upload your source folders to Supabase Storage:

```bash
# uploads ./Photos and ./WPhotos (auto-creates the public bucket)
npm run upload-gallery

# upload one folder and tag it to an event:
npm run upload-gallery -- ./Photos evt-republic-fest-2025
```

It generates compressed WebP + thumbnails, uploads both, and inserts `gallery_photos` rows. Re-runs
are safe (idempotent upsert). Add new photos any time the same way — no code change.

---

## Registration flow

1. The **Register** button (navbar / hero / event cards) opens a modal.
2. Choosing a **Category** dynamically loads the **Events** open to that category
   (`event_categories` join → `/api/events`).
3. Submit → validated (`lib/validation/registration.ts`) → saved to Supabase → success screen with
   a **Join the WhatsApp group** button.

### WhatsApp
After success, users get the group/join link from `site_content.whatsappGroupLink`. Set this to your
real `https://chat.whatsapp.com/...` invite. Automated confirmation *messages* are stubbed in
[`lib/notify/whatsapp.ts`](lib/notify/whatsapp.ts) — implement `sendConfirmation` with the WhatsApp
Cloud API or Twilio when you have a Business account; nothing else needs to change.

---

## Project structure

```
app/            routes (home, about, events, team, contact) + API routes
components/      UI, navbar/footer, registration modal+form, gallery, hero
lib/theme/       colors.ts — color management utility
lib/data/        Supabase-first data getters (fallback when not configured)
lib/supabase/    server/browser clients + env helpers
lib/validation/  shared zod registration schema
content/seed.sql Supabase schema + seed
scripts/         upload-gallery.ts
```

`lib/` is framework-agnostic and reusable by a future **React Native / Expo** app on the same
Supabase backend.

---

## Deploy

Push to GitHub and import into [Vercel](https://vercel.com). Add the same env vars in the Vercel
project settings. That's it.

## To-do for the team
- [ ] Add the real **WhatsApp group invite link** (`site_content.whatsappGroupLink`).
- [ ] Replace placeholder **team photos** (`team_members.photo_url`).
- [ ] Run `npm run upload-gallery` to publish the full photo set.
- [ ] (Optional) Wire automated WhatsApp confirmations in `lib/notify/whatsapp.ts`.
