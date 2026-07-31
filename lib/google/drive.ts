import "server-only";
import {
  googleOAuthClientId,
  googleOAuthClientSecret,
  googleOAuthRefreshToken,
} from "./env";

/**
 * Minimal Google Drive REST client — deliberately not the `googleapis` SDK.
 * We only need two things: refresh an access token, and open a *resumable
 * upload session* (return the session URL, don't stream the file ourselves).
 * The browser PUTs the actual video bytes straight to that session URL, so
 * our server is never in the data path — see components/upload/UploadForm.tsx.
 */

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/** Exchange the stored refresh token for a short-lived access token, cached
 * in-memory for the process lifetime (each token is valid ~1 hour). */
async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleOAuthClientId,
      client_secret: googleOAuthClientSecret,
      refresh_token: googleOAuthRefreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

/**
 * Opens a Drive resumable-upload session and returns the session URL. The
 * caller (browser) then PUTs the file bytes directly to that URL — no
 * Authorization header needed on that PUT, the session URL itself is the
 * credential (valid ~1 week per Google's resumable upload protocol).
 *
 * `origin` MUST be passed when the eventual PUT comes from a browser.
 * Google decides at *session-creation* time whether that session's upload
 * responses will carry CORS headers, based on the Origin on this request —
 * not on the Origin of the PUT itself. Omit it and the upload still
 * succeeds server-side, but the browser cannot read the response and fires
 * `onerror`, which looks exactly like a failed upload at 100%. Verified
 * 3/3 both ways against the live API.
 */
export async function createResumableUploadSession({
  folderId,
  fileName,
  mimeType,
  fileSize,
  origin,
}: {
  folderId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  origin?: string;
}): Promise<string> {
  const accessToken = await getAccessToken();
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(fileSize),
        ...(origin ? { Origin: origin } : {}),
      },
      body: JSON.stringify({ name: fileName, parents: [folderId] }),
    },
  );
  if (!res.ok) {
    throw new Error(`Drive session creation failed: ${res.status} ${await res.text()}`);
  }
  const sessionUrl = res.headers.get("Location");
  if (!sessionUrl) {
    throw new Error("Drive session creation succeeded but returned no Location header.");
  }
  return sessionUrl;
}

/**
 * Confirms `fileId` really is a file this upload created: it must live in
 * `folderId` and its name must start with `namePrefix` (the
 * `${registrationCode} - ` we assigned). Without both checks a client could
 * hand /api/video/complete any Drive id it knew and have it linked to a
 * registration. Returns the id when it checks out, else null.
 */
export async function verifyFileInFolder(
  fileId: string,
  folderId: string,
  namePrefix: string,
): Promise<string | null> {
  const accessToken = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}` +
      `?fields=id,name,parents,trashed`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Drive file lookup failed: ${res.status} ${await res.text()}`);
  }
  const file = (await res.json()) as {
    id: string;
    name?: string;
    parents?: string[];
    trashed?: boolean;
  };
  if (file.trashed) return null;
  if (!file.parents?.includes(folderId)) return null;
  if (!file.name?.startsWith(namePrefix)) return null;
  return file.id;
}

/**
 * Finds the most recently created file in a folder whose name starts with
 * `prefix`. The fallback path for /api/video/complete: used when the browser
 * couldn't report the id of the file it just uploaded (an upload can land
 * on Drive while the browser still fails to read the response — see
 * createResumableUploadSession). "Most recent" means a re-upload's newest
 * attempt wins.
 */
export async function findLatestFileByPrefix(
  folderId: string,
  prefix: string,
): Promise<string | null> {
  const accessToken = await getAccessToken();
  const escapedPrefix = prefix.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const q = `'${folderId}' in parents and name contains '${escapedPrefix}' and trashed = false`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}` +
      `&fields=files(id,createdTime)&orderBy=createdTime desc&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(`Drive file search failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { files?: { id: string }[] };
  return data.files?.[0]?.id ?? null;
}

/** Create a Drive folder. Used only by the one-time
 * scripts/google-drive-create-folders.ts setup script. */
export async function createDriveFolder({
  name,
  parentId,
}: {
  name: string;
  parentId?: string;
}): Promise<{ id: string; name: string }> {
  const accessToken = await getAccessToken();
  const res = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name", {
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
    throw new Error(`Drive folder creation failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
