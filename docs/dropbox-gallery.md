# Dropbox image gallery

`/image-gallery` is a protected, read-only media library for authenticated UpSwing administrators and active dealer users. Dropbox remains the image source of truth. Supabase continues to provide application authentication and role enforcement; Dropbox credentials and image binaries are not stored in Supabase.

## Dropbox app configuration

Create a scoped Dropbox API app. Prefer **App folder** access when the gallery can live inside the app namespace. Use **Full Dropbox** only if the app must read a pre-existing folder elsewhere in the account.

Enable exactly these read scopes:

- `account_info.read`
- `files.metadata.read`
- `files.content.read`

Register this exact production redirect URI in the Dropbox App Console:

```text
https://dealers.upswinggolf.com/api/dropbox/callback
```

## Environment variables

Add these server-only settings to the relevant Vercel environments and `.env.local` when testing locally:

```text
DROPBOX_APP_KEY=
DROPBOX_APP_SECRET=
DROPBOX_REDIRECT_URI=https://dealers.upswinggolf.com/api/dropbox/callback
DROPBOX_REFRESH_TOKEN=
DROPBOX_GALLERY_PATH=
DROPBOX_OAUTH_BOOTSTRAP_ENABLED=false
```

Never prefix a Dropbox setting with `NEXT_PUBLIC_`. `DROPBOX_GALLERY_PATH` is relative to the Dropbox app namespace. Leave it empty to recursively use the root of an App Folder; otherwise use a normalized Dropbox path such as `/Approved Images`. No personal folder name is hard-coded.

## One-time OAuth bootstrap

1. Temporarily set `DROPBOX_OAUTH_BOOTSTRAP_ENABLED=true` in Vercel and redeploy.
2. Sign in as an UpSwing administrator.
3. Open `https://dealers.upswinggolf.com/api/dropbox/connect`.
4. Approve the read-only Dropbox scopes.
5. The callback validates a short-lived, secure, HTTP-only OAuth state cookie and exchanges the code server-side.
6. The callback returns a one-time `text/plain` response containing `DROPBOX_REFRESH_TOKEN=...`. Copy that line into Vercel. The response has no script, is not HTML, and is marked `no-store` and `no-referrer`.
7. Remove `DROPBOX_OAUTH_BOOTSTRAP_ENABLED` or set it to `false`, then redeploy.
8. Close the callback tab. Do not paste the token into source control, logs, chat, screenshots, or client-side settings.

Bootstrap routes fail closed unless the signed-in user is an administrator, the explicit bootstrap flag is enabled, and no refresh token is currently configured. Once `DROPBOX_REFRESH_TOKEN` exists, normal gallery requests automatically exchange it for short-lived access tokens and the bootstrap routes return disabled.

## Gallery behavior

- Dropbox metadata is listed recursively and paginated through `files/list_folder` and `files/list_folder/continue`.
- Only `.jpg`, `.jpeg`, `.png`, `.webp`, and `.gif` files are shown.
- Hidden files/folders, `.DS_Store`, `Thumbs.db`, and non-image files are ignored.
- Images are sorted newest first using Dropbox server/client modification metadata, then by filename.
- Metadata is cached in server memory for 10 minutes per application instance.
- The grid uses `files/get_thumbnail_v2`; it does not preload full-resolution originals.
- The viewer and download action use `files/download` only when requested.
- Browser routes receive signed opaque image IDs. A valid ID resolves only to a Dropbox file ID returned by the configured gallery listing; arbitrary paths cannot be supplied.
- Thumbnail and original responses use private browser caching. Explicit downloads are `no-store` and retain the Dropbox filename.

The integration implements no upload, delete, move, rename, share, or other Dropbox write operation.
