import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const textExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".md", ".css", ".html", ".txt", ".map", ".rsc", ".segment", ".meta", ".body"]);
const excludedDirectories = new Set([".git", ".next", "node_modules"]);
const restrictedPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'][^"']+/,
  /GOOGLE_APPLICATION_CREDENTIALS\s*[:=]\s*["'][^"']+/,
  /sk_live_[0-9A-Za-z]+/,
];

async function filesUnder(directory, exclusions = excludedDirectories) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".env.local") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!exclusions.has(entry.name)) files.push(...await filesUnder(path, exclusions));
    } else if (textExtensions.has(extname(entry.name)) || entry.name === ".env.example") {
      files.push(path);
    }
  }
  return files;
}

async function countExactValue(files, value) {
  if (!value) return 0;
  let count = 0;
  for (const file of files) {
    if ((await readFile(file, "utf8")).includes(value)) count += 1;
  }
  return count;
}

const sourceFiles = await filesUnder(root);
const staticFiles = await filesUnder(join(root, ".next", "static"), new Set());
const prerenderedClientFiles = await filesUnder(join(root, ".next", "server", "app"), new Set());
const clientDeliverables = [...staticFiles, ...prerenderedClientFiles];
const sourceKeyMatches = await countExactValue(sourceFiles, apiKey);
const sourceMapIdMatches = await countExactValue(sourceFiles, mapId);
const clientKeyMatches = await countExactValue(clientDeliverables, apiKey);
const clientMapIdMatches = await countExactValue(clientDeliverables, mapId);
const sourceServiceRoleValueMatches = await countExactValue(sourceFiles, supabaseServiceRoleKey);
const clientServiceRoleValueMatches = await countExactValue(clientDeliverables, supabaseServiceRoleKey);
const restrictedClientMatches = [];

for (const file of clientDeliverables) {
  const contents = await readFile(file, "utf8");
  if (restrictedPatterns.some((pattern) => pattern.test(contents))) {
    restrictedClientMatches.push(relative(root, file));
  }
}

const failures = [];
if (!apiKey || !mapId) failures.push("Both documented public Google Maps variables must be available for the production-map build.");
if (sourceKeyMatches) failures.push("The configured browser key is hard-coded outside the ignored environment file.");
if (sourceMapIdMatches) failures.push("The configured Map ID is hard-coded outside the ignored environment file.");
if (sourceServiceRoleValueMatches) failures.push("The configured Supabase service-role value is hard-coded outside the ignored environment file.");
if (clientServiceRoleValueMatches) failures.push("The configured Supabase service-role value was found in a client deliverable.");
if (restrictedClientMatches.length) failures.push("A server-only credential pattern was found in the client build.");

console.log(JSON.stringify({
  publicConfigurationAvailable: Boolean(apiKey && mapId),
  hardCodedBrowserKeyFiles: sourceKeyMatches,
  hardCodedMapIdFiles: sourceMapIdMatches,
  clientFilesContainingExpectedPublicBrowserKey: clientKeyMatches,
  clientFilesContainingExpectedPublicMapId: clientMapIdMatches,
  sourceFilesContainingSupabaseServiceRoleValue: sourceServiceRoleValueMatches,
  clientFilesContainingSupabaseServiceRoleValue: clientServiceRoleValueMatches,
  clientFilesContainingServerSecretPatterns: restrictedClientMatches.length,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
