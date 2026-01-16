import { expect, test } from '@playwright/test';

const SMALL_BBOX = '-85.7,42.9,-85.6,43.0';

test.describe('More Filters panel', () => {
  test('Apply triggers filtered fetch for list and pins', async ({ page }) => {
    // Track /api/listings URLs
    let listingsUrls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/listings')) {
        listingsUrls.push(req.url());
      }
    });

    // Start with seeded searchToken so initial fetch is allowed and deterministic
    await page.goto(`/search?bbox=${encodeURIComponent(SMALL_BBOX)}&searchToken=seed`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for the first listings response once, then reset tracking so we measure Apply effects
    await page.waitForResponse(
      (res) => res.url().includes('/api/listings') && res.request().method() === 'GET',
      { timeout: 15000 },
    );
    listingsUrls = [];

    // Open More filters
    const moreButton = page.getByRole('button', { name: /more/i });
    await expect(moreButton).toBeVisible({ timeout: 10000 });
    await moreButton.click();

    const morePanel = page.getByTestId('more-filters-panel');
    await expect(morePanel).toBeVisible({ timeout: 5000 });

    const citiesInput = page.getByTestId('more-filter-cities');
    await citiesInput.fill('Testville');

    const applyButton = page.getByTestId('more-filters-apply');
    await applyButton.click();

    // Ensure new searchToken applied, then capture only post-apply requests
    await expect
      .poll(() => page.url(), { timeout: 5000 })
      .not.toContain('searchToken=seed');
    listingsUrls = [];

    // Wait for filtered requests to fire (both list and pin hydration)
    try {
      await expect.poll(
        () =>
          listingsUrls.some(
            (url) => url.includes('cities=Testville') && url.includes('limit=50'),
          ),
        { timeout: 10000 },
      ).toBeTruthy();
      await expect.poll(
        () =>
          listingsUrls.some(
            (url) => url.includes('cities=Testville') && url.includes('limit=500'),
          ),
        { timeout: 12000 },
      ).toBeTruthy();
    } catch (err) {
      const last10 = listingsUrls.slice(-10).join('\n') || 'no /api/listings requests captured';
      await test.info().attach('last_api_listings_urls', {
        body: last10,
        contentType: 'text/plain',
      });
      throw err;
    }

    // URL should reflect the applied city and a new searchToken
    await expect.poll(() => page.url(), { timeout: 5000 }).toContain('cities=Testville');
    await expect.poll(() => page.url(), { timeout: 5000 }).not.toContain('searchToken=seed');

    const last10 = listingsUrls.slice(-10).join('\n') || 'no /api/listings requests captured';
    await test.info().attach('last_api_listings_urls', {
      body: last10,
      contentType: 'text/plain',
    });
  });
});
