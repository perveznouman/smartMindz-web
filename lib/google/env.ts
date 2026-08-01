/** Centralised Google OAuth env access + a single "is it configured?" check. */

export const googleOAuthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID ?? "";
export const googleOAuthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "";
export const googleOAuthRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN ?? "";

/** True when the video-upload feature can talk to Drive at all. */
export const isGoogleDriveConfigured = Boolean(
  googleOAuthClientId && googleOAuthClientSecret && googleOAuthRefreshToken,
);
