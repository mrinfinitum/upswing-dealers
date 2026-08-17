import "server-only";

export class DropboxConfigurationError extends Error {
  constructor(message = "Dropbox server configuration is incomplete.") {
    super(message);
    this.name = "DropboxConfigurationError";
  }
}

function required(name: "DROPBOX_APP_KEY" | "DROPBOX_APP_SECRET" | "DROPBOX_REDIRECT_URI" | "DROPBOX_REFRESH_TOKEN") {
  const value = process.env[name]?.trim();
  if (!value) throw new DropboxConfigurationError(`Required Dropbox setting ${name} is missing.`);
  return value;
}

export function getDropboxOAuthConfig() {
  return {
    appKey: required("DROPBOX_APP_KEY"),
    appSecret: required("DROPBOX_APP_SECRET"),
    redirectUri: required("DROPBOX_REDIRECT_URI"),
  };
}

export function getDropboxServerConfig() {
  return {
    ...getDropboxOAuthConfig(),
    refreshToken: required("DROPBOX_REFRESH_TOKEN"),
    galleryPath: normalizeGalleryPath(process.env.DROPBOX_GALLERY_PATH),
  };
}

export function normalizeGalleryPath(value: string | undefined) {
  const path = value?.trim();
  if (!path || path === "/") return "";
  if (path.includes("\0")) throw new DropboxConfigurationError("DROPBOX_GALLERY_PATH is invalid.");
  return `/${path.replace(/^\/+|\/+$/g, "")}`;
}

export function isDropboxBootstrapEnabled() {
  return process.env.DROPBOX_OAUTH_BOOTSTRAP_ENABLED === "true" && !process.env.DROPBOX_REFRESH_TOKEN?.trim();
}
