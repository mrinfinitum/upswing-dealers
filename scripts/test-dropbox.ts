import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  collectDropboxPages,
  createGalleryImageId,
  analyzeGalleryEntries,
  galleryImagesFromEntries,
  galleryContentType,
  isSupportedGalleryFile,
  parseDropboxListPage,
  resolveGalleryImageId,
} from "../lib/dropbox/image-utils";
import { galleryCategories } from "../types/gallery";

assert.deepEqual(galleryCategories, ["upswing", "galaxy", "accessories"]);

assert.equal(isSupportedGalleryFile("hero.jpg"), true);
assert.equal(isSupportedGalleryFile("hero.JPEG"), true);
assert.equal(isSupportedGalleryFile("hero.png"), true);
assert.equal(isSupportedGalleryFile("hero.webp"), true);
assert.equal(isSupportedGalleryFile("hero.gif"), true);
assert.equal(galleryContentType("hero.jpeg"), "image/jpeg");
assert.equal(galleryContentType("hero.PNG"), "image/png");
assert.equal(isSupportedGalleryFile("hero.tiff"), false);
assert.equal(isSupportedGalleryFile("brochure.pdf"), false);
assert.equal(isSupportedGalleryFile("Thumbs.db"), false);
assert.equal(isSupportedGalleryFile(".DS_Store"), false);
assert.equal(isSupportedGalleryFile("hero.jpg", "/.private/hero.jpg"), false);

const secret = "test-only-signing-secret";
const entries = [
  { ".tag": "file", id: "id:older", name: "older.jpg", path_display: "/older.jpg", server_modified: "2026-01-01T00:00:00Z" },
  { ".tag": "file", id: "id:newer", name: "newer.PNG", path_display: "/newer.PNG", server_modified: "2026-02-01T00:00:00Z", media_info: { metadata: { dimensions: { width: 1200, height: 800 } } } },
  { ".tag": "file", id: "id:thumbs", name: "Thumbs.db", path_display: "/Thumbs.db" },
  { ".tag": "file", id: "id:hidden", name: "hidden.jpg", path_display: "/.hidden/hidden.jpg" },
  { ".tag": "folder", id: "id:folder", name: "Folder", path_display: "/Folder" },
];
const images = galleryImagesFromEntries(entries, secret);
assert.deepEqual(images.map((image) => image.name), ["newer.PNG", "older.jpg"]);
assert.equal(images[0].width, 1200);
assert.equal(images[0].height, 800);
const analysis = analyzeGalleryEntries(entries, secret);
assert.deepEqual(analysis.diagnostics, {
  dropboxEntries: 5,
  files: 4,
  supportedImageExtension: 3,
  nonHiddenSupportedImages: 2,
  finalGalleryImages: 2,
});

const opaqueId = createGalleryImageId("id:newer", secret);
assert.equal(resolveGalleryImageId(opaqueId, secret), "id:newer");
assert.throws(() => resolveGalleryImageId(`${opaqueId}tampered`, secret), /Invalid gallery image ID/);
assert.throws(() => resolveGalleryImageId("../../outside", secret), /Invalid gallery image ID/);

async function testPagination() {
  const cursors: string[] = [];
  const paginated = await collectDropboxPages(
    { entries: [{ name: "first" }], cursor: "cursor-1", has_more: true },
    async (cursor) => {
      cursors.push(cursor);
      return { entries: [{ name: "second" }], cursor: "cursor-2", has_more: false };
    },
  );
  assert.deepEqual(cursors, ["cursor-1"]);
  assert.equal(paginated.length, 2);
  await assert.rejects(() => collectDropboxPages({ entries: [], cursor: "one", has_more: true }, async () => ({ nope: true })), /malformed list response/);
  await assert.rejects(() => collectDropboxPages({ entries: [], cursor: "repeat", has_more: true }, async () => ({ entries: [], cursor: "repeat", has_more: true })), /invalid pagination cursor/);
}

assert.deepEqual(galleryImagesFromEntries([], secret), []);
assert.throws(() => parseDropboxListPage({ entries: "invalid", has_more: false }), /malformed list response/);

const config = readFileSync("lib/dropbox/config.ts", "utf8");
const server = readFileSync("lib/dropbox/server.ts", "utf8");
const repository = readFileSync("lib/dropbox/images.ts", "utf8");
const connectRoute = readFileSync("app/api/dropbox/connect/route.ts", "utf8");
const callbackRoute = readFileSync("app/api/dropbox/callback/route.ts", "utf8");
const thumbnailRoute = readFileSync("app/api/dropbox/images/[id]/thumbnail/route.ts", "utf8");
const originalRoute = readFileSync("app/api/dropbox/images/[id]/original/route.ts", "utf8");
const galleryAuth = readFileSync("lib/gallery/auth.ts", "utf8");
const galleryPage = readFileSync("app/image-gallery/page.tsx", "utf8");
const galleryPageContent = readFileSync("components/image-gallery/image-gallery-page-content.tsx", "utf8");
const galleryClient = readFileSync("components/image-gallery/image-gallery.tsx", "utf8");
const categoryRepository = readFileSync("lib/gallery/categories.ts", "utf8");
const categoryAction = readFileSync("app/image-gallery/actions.ts", "utf8");
const categoryMigration = readFileSync("supabase/migrations/202608170003_create_gallery_categories.sql", "utf8");

assert.match(config, /required\("DROPBOX_REFRESH_TOKEN"\)/, "normal operation requires a refresh token");
assert.match(config, /DROPBOX_GALLERY_PATH/, "the Dropbox gallery root is configurable");
assert.match(server, /import "server-only"/, "Dropbox API access is server-only");
assert.doesNotMatch(server, /NEXT_PUBLIC_/, "Dropbox credentials are never public variables");
assert.match(repository, /files\/list_folder\/continue/, "Dropbox pagination is implemented");
assert.match(repository, /files\/get_thumbnail_v2/, "the thumbnail repository uses Dropbox thumbnails");
assert.match(repository, /metadataCache = images\.length \?/, "empty Dropbox results are not retained as stale metadata cache entries");
assert.doesNotMatch(server, /files\/(?:upload|delete|move|copy)|sharing\//, "the Dropbox server client exposes no write or sharing operations");
assert.match(connectRoute, /randomBytes\(32\)/, "OAuth state is cryptographically random");
assert.match(connectRoute, /searchParams\.set\("state", state\)/, "OAuth state is sent to Dropbox for callback validation");
assert.match(connectRoute, /token_access_type", "offline"/, "OAuth requests offline access");
assert.match(connectRoute, /account_info\.read files\.metadata\.read files\.content\.read/, "OAuth requests only approved read scopes");
assert.match(callbackRoute, /timingSafeEqual/, "OAuth state comparison is timing safe");
assert.match(callbackRoute, /Content-Type": "text\/plain/, "bootstrap output is never returned in HTML");
assert.match(callbackRoute, /Cache-Control": "no-store/, "bootstrap token output cannot be cached");
assert.match(thumbnailRoute, /getGalleryIdentity/, "thumbnail requests enforce Supabase-backed gallery authorization");
assert.match(originalRoute, /getGalleryIdentity/, "original and download requests enforce Supabase-backed gallery authorization");
assert.match(originalRoute, /Content-Disposition/, "downloads preserve an attachment filename");
assert.match(galleryAuth, /getAdminIdentity/, "administrators are accepted by the gallery guard");
assert.match(galleryAuth, /getDealerPortalIdentity/, "active dealer users are accepted by the gallery guard");
assert.match(galleryPage, /ImageGalleryPageContent role=\{identity\.role\}/, "the authenticated gallery route delegates to the shared server-rendered gallery content");
assert.match(galleryPageContent, /<ImageGallery images=\{images\}/, "the shared Server Component passes its Dropbox result directly to the gallery client");
assert.match(galleryPageContent, /<GalleryHydrationDiagnostic images=\{images\.length\}/, "the client receives the server image count during hydration");
assert.doesNotMatch(galleryClient, /setImages|fetch\(|router\.refresh/, "hydration cannot replace server-provided images with an empty client response");
assert.match(galleryClient, /galleryCategories\.map/, "all approved category pills are rendered from the typed category list");
assert.doesNotMatch(galleryClient, /Assign categories|canManageCategories|managingCategories/, "the shared gallery does not expose category assignment controls");
assert.match(galleryClient, /const galleryPageSizes = \[20, 50, 100\]/, "gallery batch controls support 20, 50, and 100 images");
assert.match(galleryClient, /new IntersectionObserver/, "gallery cards progressively load as the user scrolls");
assert.match(galleryClient, /loading="lazy" decoding="async"/, "gallery thumbnails use native lazy loading and asynchronous decoding");
assert.match(galleryClient, /displayedImages\.map/, "only the current image batch is mounted in the grid");
assert.match(categoryAction, /await requireAdmin\(\)/, "bulk category assignment independently requires administrator authorization");
assert.match(categoryAction, /rawDropboxImageId/, "bulk assignment validates signed gallery image IDs server-side");
assert.match(categoryAction, /\.slice\(0, 500\)/, "bulk assignment has a bounded input size");
assert.match(categoryRepository, /\.in\("dropbox_file_id"/, "gallery metadata is loaded only for Dropbox files in the current result");
assert.match(categoryMigration, /check \(category in \('upswing', 'galaxy', 'accessories'\)\)/, "the database constrains gallery categories");
assert.match(categoryMigration, /Admins manage gallery categories/, "only administrators can mutate gallery category metadata");
assert.match(categoryMigration, /Active dealers view gallery categories/, "active dealer users can read category metadata");
assert.doesNotMatch(categoryMigration, /storage|bytea|blob/i, "Supabase stores metadata only, never Dropbox image binaries");

testPagination().then(() => console.log("Dropbox gallery filtering, pagination, safe IDs, OAuth, and route gating checks passed."));
