# Dropbox image gallery

The protected admin image gallery reads supported image files recursively from one Dropbox folder. Dropbox credentials remain server-only; the browser receives thumbnails and downloads through authenticated application routes.

## Create the Dropbox app

1. Create a scoped Dropbox API app in the Dropbox App Console.
2. Prefer **App folder** access and place the gallery inside that app folder. Select **Full Dropbox** only when the gallery must read a pre-existing folder elsewhere in the account.
3. Enable only `files.metadata.read` and `files.content.read`.
4. In the OAuth authorization request, include `token_access_type=offline` so Dropbox returns a refresh token.
5. Exchange the authorization code once and store the resulting refresh token as a secret. Do not commit it.

Dropbox's server-side authorization URL can be created from this pattern:

```text
https://www.dropbox.com/oauth2/authorize?client_id=YOUR_APP_KEY&response_type=code&token_access_type=offline
```

Exchange the returned authorization code at `https://api.dropboxapi.com/oauth2/token` using the app key and secret, `grant_type=authorization_code`, and the code. The refresh token is returned only when offline access was requested.

## Environment variables

Add these to `.env.local` and to the corresponding Vercel environments:

```text
DROPBOX_APP_KEY=
DROPBOX_APP_SECRET=
DROPBOX_REFRESH_TOKEN=
DROPBOX_GALLERY_FOLDER=/Image Gallery
```

`DROPBOX_GALLERY_FOLDER` is relative to the app namespace. Use an empty value for its root. A short-lived `DROPBOX_ACCESS_TOKEN` can be used for local testing instead of the three OAuth values, but is not recommended for production.

After changing local variables, restart the Next.js development server. The gallery is available to authenticated UpSwing administrators at `/admin/gallery`.

## Supported images

The Dropbox thumbnail API currently supports BMP, GIF, JPEG, PNG, PPM, TIFF, and WebP. Other files remain untouched in Dropbox but are not shown in this image gallery.
