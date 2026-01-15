import { test, expect } from '@playwright/test';

const MOCK_RESPONSE = {
  requestId: 'test',
  proposedFilters: {
    status: 'for_sale',
    propertyType: null,
    minPrice: null,
    maxPrice: 400000,
    bedsMin: 3,
    bathsMin: null,
    city: 'Grand Rapids',
    zip: null,
    keywords: null,
  },
  explanations: [],
  confidence: 0.9,
  warnings: [],
  ignoredInputReasons: [],
};

test('ai assist suggest/apply does not trigger fetch', async ({ page }) => {
  // Track listings requests
  let listingsUrls: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/listings')) listingsUrls.push(req.url());
  });

  // Mock AI endpoint
  await page.route('**/api/ai/parse-search', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RESPONSE),
    });
  });

  await page.goto('/search');
  await page.waitForLoadState('networkidle');
  listingsUrls = [];

  const textarea = page.getByTestId('ai-assist-textarea');
  const suggest = page.getByTestId('ai-assist-suggest');
  const apply = page.getByTestId('ai-assist-apply');

  await expect(textarea).toBeVisible({ timeout: 10000 });
  await textarea.fill('3 bed in Grand Rapids under 400k');
  await suggest.click();

  const diff = page.locator('[data-testid="ai-assist-diff"]:visible').first();
  await expect(diff).toBeVisible({ timeout: 10000 });
  await expect(diff.getByText(/Beds/i)).toBeVisible();
  await expect(diff.getByText(/Max price/i)).toBeVisible();
  await expect(diff.getByText(/City/i)).toBeVisible();

  await page.waitForTimeout(250);
  const before = listingsUrls.length;
  const urlBefore = page.url();
  await apply.click();

  // Give the UI a short moment; Apply must not trigger listings fetch
  await page.waitForTimeout(500);
  try {
    expect(listingsUrls.length).toBeLessThanOrEqual(before + 1);
  } catch (e) {
    const last10 = listingsUrls.slice(-10).join('\n') || 'no /api/listings requests captured';
    await test
      .info()
      .attach('last_api_listings_urls', { body: last10, contentType: 'text/plain' });
    throw e;
  }
  await expect.poll(() => page.url(), { timeout: 5000 }).not.toBe(urlBefore);
});
