/**
 * One-time OAuth setup for the video-upload feature's Google Drive access.
 *
 * Before running this:
 *   1. In Google Cloud Console, create/reuse a project and enable the
 *      "Google Drive API" (APIs & Services -> Library).
 *   2. Create an OAuth 2.0 Client ID (APIs & Services -> Credentials -> Create
 *      Credentials -> OAuth client ID), type "Web application", and add
 *      http://localhost:8973/oauth/callback as an Authorized redirect URI.
 *   3. Put that client's ID and secret in .env.local as GOOGLE_OAUTH_CLIENT_ID
 *      and GOOGLE_OAUTH_CLIENT_SECRET.
 *
 * Then run:
 *   npx tsx scripts/google-drive-authorize.ts
 *
 * It starts a tiny local server, prints a consent URL to open in your
 * browser — sign in with whichever Google account should own the uploaded
 * videos — and once you approve, prints a refresh token. Paste that into
 * .env.local as GOOGLE_OAUTH_REFRESH_TOKEN. This only needs to be done once;
 * the refresh token doesn't expire under normal use.
 *
 * Scope requested: drive.file — the app can only see/manage files it creates
 * itself, not your whole Drive. That's why scripts/google-drive-create-folders.ts
 * (which you'll run next) creates the event folders itself rather than you
 * making them by hand in the Drive UI.
 */
import { createServer } from "node:http";
import { config } from "dotenv";

config({ path: ".env.local" });

const PORT = 8973;
const REDIRECT_URI = `http://localhost:${PORT}/oauth/callback`;
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET in .env.local.\n" +
      "Create an OAuth 2.0 Client ID in Google Cloud Console first — see the header comment in this file.",
  );
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/drive.file");
authUrl.searchParams.set("access_type", "offline");
// Force a refresh_token even if this Google account has authorized this app
// before — without it, a repeat consent can come back with no refresh_token.
authUrl.searchParams.set("prompt", "consent");

const server = createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth/callback")) {
    res.writeHead(404).end();
    return;
  }
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    res
      .writeHead(200, { "Content-Type": "text/html" })
      .end(`<p>Google returned an error: ${oauthError}. You can close this tab.</p>`);
    console.error(`Google returned an error: ${oauthError}`);
    server.close();
    process.exit(1);
  }
  if (!code) {
    res.writeHead(400).end("Missing code");
    return;
  }

  res
    .writeHead(200, { "Content-Type": "text/html" })
    .end("<p>Authorized. You can close this tab and go back to the terminal.</p>");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });
    const data = (await tokenRes.json()) as {
      refresh_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!tokenRes.ok) {
      console.error("Token exchange failed:", data);
      process.exit(1);
    }
    if (!data.refresh_token) {
      console.error(
        "No refresh_token in the response. This usually means you've already " +
          "authorized this app before without revoking access — go to " +
          "https://myaccount.google.com/permissions, remove this app's access, and re-run.",
      );
      process.exit(1);
    }
    console.log("\nSuccess! Add this to .env.local:\n");
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${data.refresh_token}\n`);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT, () => {
  console.log("Open this URL in your browser and sign in with the Google account");
  console.log("that should own the uploaded videos:\n");
  console.log(authUrl.toString());
  console.log(`\nWaiting for the redirect on ${REDIRECT_URI} ...`);
});
