import { expect, test } from '@playwright/test';

const START_BBOX = '-85.8,42.8,-85.7,42.9';
const TARGET_BBOX = '-84.65,42.65,-84.45,42.85';
const TARGET_QUERY = 'Lansing';

const last10 = (urls: string[]) => urls.slice(-10).join('\n') || 'none';

test('omnibox Enter geocodes and applies bbox to listings', async ({ page }) => {
  let listingsUrls: string[] = [];

  await page.route('**/api/geo/geocode', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        result: {
          bbox: TARGET_BBOX,
          center: { lat: 42.75, lng: -84.55 },
          displayName: TARGET_QUERY,
          type: 'place',
        },
      }),
    });
  });

  await page.route('**/api/listings**', async (route) => {
    listingsUrls.push(route.request().url());
    const url = new URL(route.request().url());
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const body = {
      results: [],
      pagination: {
        page: 1,
        limit,
        pageCount: 0,
        hasMore: false,
      },
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  await page.goto(`/search?bbox=${encodeURIComponent(START_BBOX)}&searchToken=seed`);
  await page.waitForLoadState('domcontentloaded');

  const input = page.getByPlaceholder('City, ZIP, Address');
  await input.fill(TARGET_QUERY);
  await input.press('Enter');

  const targetBboxEncoded = encodeURIComponent(TARGET_BBOX);

  try {
    await expect
      .poll(() => page.url(), { timeout: 10000 })
      .toContain(`bbox=${targetBboxEncoded}`);
    await expect
      .poll(() => {
        const url = new URL(page.url());
        return url.searchParams.get('searchToken');
      }, { timeout: 10000 })
      .not.toBe('seed');
    await expect
      .poll(
        () => listingsUrls.some((u) => decodeURIComponent(u).includes(TARGET_BBOX)),
        { timeout: 10000 },
      )
      .toBeTruthy();
  } catch (err) {
    await test.info().attach('last_api_listings_urls', {
      body: last10(listingsUrls),
      contentType: 'text/plain',
    });
    throw err;
  }
});
