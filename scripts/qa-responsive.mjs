import fs from "node:fs/promises";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3001";
const devtoolsUrl = process.argv[3] ?? "http://127.0.0.1:9223";
const viewports = [1440, 1024, 768, 430, 390, 375, 320];

const target = await fetch(`${devtoolsUrl}/json/new?${encodeURIComponent(baseUrl)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
const pending = new Map();
const eventWaiters = new Map();
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
  if (message.method && eventWaiters.has(message.method)) {
    for (const resolve of eventWaiters.get(message.method)) resolve(message.params);
    eventWaiters.delete(message.method);
  }
});

const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++commandId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const waitForEvent = (method) => new Promise((resolve) => {
  const waiters = eventWaiters.get(method) ?? [];
  waiters.push(resolve);
  eventWaiters.set(method, waiters);
});

const evaluate = async (expression) => {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};

await command("Page.enable");
await command("Runtime.enable");
const reports = [];

for (const width of viewports) {
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  const loaded = waitForEvent("Page.loadEventFired");
  await command("Page.navigate", { url: baseUrl });
  await loaded;
  await new Promise((resolve) => setTimeout(resolve, 150));

  const report = await evaluate(`(() => {
    const root = document.documentElement;
    const card = document.querySelector('.dealer-card');
    const map = document.querySelector('.map-panel__canvas');
    const input = document.querySelector('input[type="search"]');
    return {
      width: innerWidth,
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      cardWidth: card?.getBoundingClientRect().width ?? 0,
      mapHeight: map?.getBoundingClientRect().height ?? 0,
      inputWidth: input?.getBoundingClientRect().width ?? 0,
      initialMarkerCount: document.querySelector('.map-panel__google-map')?.dataset.dealerMarkerCount ?? null,
      initialPromptVisible: Boolean(document.querySelector('.map-panel__search-prompt')),
      mobileMenu: getComputedStyle(document.querySelector('.site-header__mobile-menu')).display,
    };
  })()`);
  reports.push(report);
  const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await fs.writeFile(`/tmp/upswing-cdp-${width}.png`, Buffer.from(screenshot.data, "base64"));
}

await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 1000, deviceScaleFactor: 1, mobile: true });
const loaded = waitForEvent("Page.loadEventFired");
await command("Page.navigate", { url: baseUrl });
await loaded;
await command("Browser.grantPermissions", { origin: baseUrl, permissions: ["geolocation"] });
await command("Emulation.setGeolocationOverride", { latitude: 41.8781, longitude: -87.6298, accuracy: 50 });

const interaction = await evaluate(`(async () => {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 80));
  const waitForSearch = async () => {
    const started = Date.now();
    while (Date.now() - started < 5000) {
      if (!document.querySelector('.locator-search button[type="submit"]')?.disabled) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  };
  document.querySelector('.map-panel__location-option button')?.click();
  await new Promise((resolve) => setTimeout(resolve, 180));
  const geolocationCopy = document.querySelector('.locator-search__status')?.textContent;
  document.querySelector('.locator-search__utilities button:last-child')?.click();
  await pause();
  const submitValue = (value) => {
    const input = document.querySelector('input[type="search"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('form[role="search"]').requestSubmit();
  };
  submitValue('United States');
  await waitForSearch();
  const countryCount = document.querySelector('.locator-results-status').textContent;

  submitValue('Club Champion');
  await waitForSearch();
  const retailerCount = document.querySelector('.locator-results-status').textContent;

  submitValue('1005 Holcomb Woods Parkway');
  await waitForSearch();
  const addressCount = document.querySelector('.locator-results-status').textContent;
  const enrichedAddressVisible = document.querySelector('.dealer-card__address')?.textContent.includes('1005 Holcomb Woods Parkway') ?? false;
  const directionsWorks = Boolean(document.querySelector('.dealer-card__actions a[href*="google.com/maps/dir/"]'));
  const phoneWorks = Boolean(document.querySelector('.dealer-card__actions a[href^="tel:"]'));
  const dealerWebsiteWorks = Boolean(document.querySelector('.dealer-card__actions a[href*="pgatoursuperstore.com/stores/detail"]'));

  submitValue('99999');
  await waitForSearch();
  const emptyCopy = document.querySelector('.locator-empty p')?.textContent;

  document.querySelector('.locator-search__utilities button:last-child')?.click();
  await pause();
  const resetCount = document.querySelector('.locator-results-status')?.textContent ?? null;
  const resetPromptVisible = Boolean(document.querySelector('.map-panel__search-prompt'));
  const resetMarkerCount = document.querySelector('.map-panel__google-map')?.dataset.dealerMarkerCount ?? null;
  const externalLinksCanonical = [...document.querySelectorAll('a[href^="http"][href*="upswinggolf.com"]')]
    .every((link) => link.href.startsWith('https://www.upswinggolf.com/'));
  return { geolocationCopy, countryCount, retailerCount, addressCount, enrichedAddressVisible, emptyCopy, resetCount, resetPromptVisible, resetMarkerCount, externalLinksCanonical, directionsWorks, phoneWorks, dealerWebsiteWorks };
})()`);

socket.close();
const failures = [];
for (const report of reports) {
  if (report.scrollWidth > report.clientWidth || report.bodyScrollWidth > report.clientWidth) failures.push(`${report.width}px has horizontal overflow`);
  if (report.cardWidth > report.clientWidth) failures.push(`${report.width}px dealer card exceeds viewport`);
  if (report.mapHeight < 300) failures.push(`${report.width}px map is too short`);
  if (!report.initialPromptVisible || ![null, '0'].includes(report.initialMarkerCount)) failures.push(`${report.width}px initial locator state exposes dealer results`);
}
if (interaction.countryCount !== '63 locations for “United States”') failures.push('Country search failed');
if (interaction.retailerCount !== '50 locations for “Club Champion”') failures.push('Retailer search failed');
if (!interaction.addressCount?.includes('within 50 miles') || !interaction.enrichedAddressVisible) failures.push('Address search failed');
if (!interaction.emptyCopy || interaction.resetCount !== null || !interaction.resetPromptVisible || ![null, '0'].includes(interaction.resetMarkerCount)) failures.push('Empty or reset state failed');
if (!interaction.externalLinksCanonical || !interaction.directionsWorks || !interaction.phoneWorks || !interaction.dealerWebsiteWorks) failures.push('Dealer or Shopify action validation failed');
console.log(JSON.stringify({ viewports: reports, interaction, failures }, null, 2));
if (failures.length) process.exitCode = 1;
