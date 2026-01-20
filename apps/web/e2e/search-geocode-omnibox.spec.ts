import { expect, test } from '@playwright/test';

const MOCK_BBOX = '-85.7,42.9,-85.6,43.0';

const last10 = (urls: string[]) => urls.slice(-10).join('\n') || 'none';

test('omnibox geocode updates bbox, bumps searchToken, and triggers listings fetch', async ({ page }) => {
  let listingsUrls: string[] = [];

  await page.route('**/api/geo/geocode', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        result: {
          bbox: MOCK_BBOX,
          center: { lat: 42.95, lng: -85.65 },
          displayName: 'Mock City, MI',
          type: 'city',
        },
      }),
    });
  });

  await page.route('**/api/listings**', async (route) => {
    listingsUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [],
        pagination: { page: 1, limit: 50, pageCount: 0, hasMore: false },
      }),
    });
  });

  await page.goto('/search?bbox=-85.8,42.8,-85.7,42.9&searchToken=seed');
  await page.waitForLoadState('domcontentloaded');

  const input = page.getByPlaceholder('City, ZIP, Address');
  await input.click();
  await input.fill('Mock City');
  await input.press('Enter');

  try {
    await expect
      .poll(() => decodeURIComponent(page.url()), { timeout: 8000 })
      .toContain(`bbox=${MOCK_BBOX}`);
    await expect
      .poll(() => page.url().includes('searchToken=seed'), { timeout: 8000 })
      .toBeFalsy();
    await expect
      .poll(() => listingsUrls.some((u) => decodeURIComponent(u).includes(MOCK_BBOX)), { timeout: 8000 })
      .toBeTruthy();
  } catch (err) {
    await test.info().attach('last_api_listings_urls', {
      body: last10(listingsUrls),
      contentType: 'text/plain',
    });
    await test.info().attach('url_after_enter', {
      body: page.url(),
      contentType: 'text/plain',
    });
    throw err;
  }

  await test.info().attach('last_api_listings_urls', {
    body: last10(listingsUrls),
    contentType: 'text/plain',
  });
});
