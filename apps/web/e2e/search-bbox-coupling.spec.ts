import { test, expect } from '@playwright/test';

test('search listings use bbox-filtered results and render matching IDs', async ({ page }) => {
  const listingsResponses: { url: string; json: any }[] = [];
  const listingsRequests: string[] = [];
  let lastListingsResponse: { url: string; status: number; ok: boolean; hasResults: boolean } | null =
    null;

  page.on('console', (msg) => {
    // helpful for debugging in CI logs
    console.log(`[console] ${msg.type()}: ${msg.text()}`);
  });

  page.on('request', (request) => {
    if (request.url().includes('/api/listings')) {
      listingsRequests.push(request.url());
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('/api/listings')) return;
    try {
      const json = await response.json();
      const hasResults = json && Array.isArray(json.results);
      lastListingsResponse = { url, status: response.status(), ok: response.ok(), hasResults };
      if (response.ok() && hasResults) {
        listingsResponses.push({ url, json });
      }
    } catch {
      // ignore parse errors
    }
  });

  await page.goto('/search', { waitUntil: 'domcontentloaded' });

  const waitStart = Date.now();
  while (listingsResponses.length === 0 && Date.now() - waitStart < 30000) {
    await page.waitForTimeout(500);
  }

  if (listingsResponses.length === 0) {
    throw new Error(
      `No successful /api/listings responses captured within 30s.\nLast seen: ${lastListingsResponse?.url ?? 'none'} status=${lastListingsResponse?.status ?? 'n/a'} ok=${lastListingsResponse?.ok ?? 'n/a'} hasResults=${lastListingsResponse?.hasResults ?? 'n/a'}\nRequests seen: ${listingsRequests.slice(-10).join(' | ') || 'none'}`,
    );
  }

  await page.waitForSelector('[data-listing-id]', { timeout: 30000, state: 'attached' });
  await page.waitForTimeout(500);

  const cards = await page.$$('[data-listing-id]');
  const renderedIds: string[] = [];
  for (const card of cards) {
    const id = await card.getAttribute('data-listing-id');
    if (id) renderedIds.push(id);
  }

  expect(listingsResponses.length).toBeGreaterThan(0);

  const bboxResponse =
    [...listingsResponses].reverse().find((r) => r.url.includes('bbox=')) ??
    listingsResponses[listingsResponses.length - 1];

  if (!bboxResponse?.url.includes('bbox=')) {
    throw new Error(
      `No /api/listings response with bbox found. Last url=${bboxResponse?.url ?? 'none'}`,
    );
  }

  const responseIds = Array.isArray(bboxResponse.json?.results)
    ? bboxResponse.json.results.map((r: any) => String(r.id ?? r.mlsId ?? '')).filter(Boolean)
    : [];

  const compareLen = Math.min(renderedIds.length, responseIds.length);
  if (compareLen === 0) {
    throw new Error(
      `No comparable IDs. url=${bboxResponse.url}\nresp first5=${responseIds.slice(
        0,
        5,
      )}\ndom first5=${renderedIds.slice(0, 5)}`,
    );
  }

  const respSlice = responseIds.slice(0, compareLen);
  const domSlice = renderedIds.slice(0, compareLen);
  if (JSON.stringify(respSlice) !== JSON.stringify(domSlice)) {
    throw new Error(
      `Rendered IDs do not match response.\nurl=${bboxResponse.url}\nresp first5=${responseIds.slice(
        0,
        5,
      )}\ndom first5=${renderedIds.slice(0, 5)}`,
    );
  }

  expect(true).toBe(true);
});
