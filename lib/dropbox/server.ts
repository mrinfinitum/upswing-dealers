import "server-only";

import { getDropboxOAuthConfig, getDropboxServerConfig } from "./config";

export class DropboxApiError extends Error {
  status: number;

  constructor(operation: string, status: number) {
    super(`Dropbox ${operation} failed with status ${status}.`);
    this.name = "DropboxApiError";
    this.status = status;
  }
}

let cachedToken: { value: string; expiresAt: number } | undefined;

export async function getDropboxAccessToken() {
  const config = getDropboxServerConfig();
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const authorization = Buffer.from(`${config.appKey}:${config.appSecret}`).toString("base64");
  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: config.refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) throw new DropboxApiError("access-token refresh", response.status);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("access_token" in payload) || typeof payload.access_token !== "string") throw new DropboxApiError("access-token refresh response", 502);
  const expiresIn = "expires_in" in payload && typeof payload.expires_in === "number" ? payload.expires_in : 14_400;
  cachedToken = { value: payload.access_token, expiresAt: Date.now() + expiresIn * 1000 };
  return cachedToken.value;
}

export async function exchangeDropboxAuthorizationCode(code: string) {
  const config = getDropboxOAuthConfig();
  const authorization = Buffer.from(`${config.appKey}:${config.appSecret}`).toString("base64");
  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, grant_type: "authorization_code", redirect_uri: config.redirectUri }),
    cache: "no-store",
  });
  if (!response.ok) throw new DropboxApiError("authorization-code exchange", response.status);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("refresh_token" in payload) || typeof payload.refresh_token !== "string") throw new DropboxApiError("authorization-code exchange response", 502);
  return payload.refresh_token;
}

export async function dropboxRpc(endpoint: "files/list_folder" | "files/list_folder/continue", body: object) {
  const response = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getDropboxAccessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw new DropboxApiError(endpoint, response.status);
  return response.json() as Promise<unknown>;
}

export async function dropboxContent(endpoint: "files/get_thumbnail_v2" | "files/download", argument: object) {
  const response = await fetch(`https://content.dropboxapi.com/2/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getDropboxAccessToken()}`, "Dropbox-API-Arg": JSON.stringify(argument) },
    cache: "no-store",
  });
  if (!response.ok) throw new DropboxApiError(endpoint, response.status);
  return response;
}
