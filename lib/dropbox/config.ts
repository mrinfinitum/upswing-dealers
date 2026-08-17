import "server-only";

export class DropboxConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DropboxConfigurationError";
  }
}

export type DropboxConfig = {
  appKey?: string;
  appSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  galleryFolder: string;
};

function normalizeFolder(folder: string | undefined) {
  const trimmed = folder?.trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

export function getDropboxConfig(): DropboxConfig {
  const config = {
    appKey: process.env.DROPBOX_APP_KEY?.trim(),
    appSecret: process.env.DROPBOX_APP_SECRET?.trim(),
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN?.trim(),
    accessToken: process.env.DROPBOX_ACCESS_TOKEN?.trim(),
    galleryFolder: normalizeFolder(process.env.DROPBOX_GALLERY_FOLDER),
  };

  if (!config.accessToken && !(config.appKey && config.appSecret && config.refreshToken)) {
    throw new DropboxConfigurationError("Dropbox is not connected yet. Add the server-only Dropbox environment variables to load the gallery.");
  }

  return config;
}
