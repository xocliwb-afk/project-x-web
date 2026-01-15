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
  let listingsCount = 0;
  page.on('request', (req) => {
    if (req.url().includes('/api/listings')) listingsCount += 1;
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

  const textarea = page.locator('[data-testid="ai-assist-textarea"]:visible').first();
  const suggest = page.locator('[data-testid="ai-assist-suggest"]:visible').first();
  const apply = page.locator('[data-testid="ai-assist-apply"]:visible').first();

  await expect(textarea).toBeVisible({ timeout: 10000 });
  await textarea.fill('3 bed in Grand Rapids under 400k');
  await suggest.click();

  const diff = page.locator('[data-testid="ai-assist-diff"]:visible').first();
  await expect(diff).toBeVisible({ timeout: 10000 });
  await expect(diff.getByText(/Beds/i)).toBeVisible();
  await expect(diff.getByText(/Max price/i)).toBeVisible();
  await expect(diff.getByText(/City/i)).toBeVisible();

  const before = listingsCount;
  await apply.click();

  // Give the UI a short moment; Apply must not trigger listings fetch
  await page.waitForTimeout(500);
  expect(listingsCount).toBe(before);
});
