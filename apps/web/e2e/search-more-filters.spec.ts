import { expect, test } from '@playwright/test';

const SMALL_BBOX = '-85.7,42.9,-85.6,43.0';

test.describe('More Filters panel', () => {
  test('Apply does not fetch; Search this area fetches with new params', async ({ page }) => {
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

    // Allow URL update to settle
    await page.waitForTimeout(600);

    // Apply should NOT trigger a fetch
    const urlsAfterApply = [...listingsUrls];
    try {
      expect(urlsAfterApply.length).toBe(0);
    } catch (err) {
      const last10 = urlsAfterApply.slice(-10).join('\n') || 'no /api/listings requests captured';
      await test.info().attach('last_api_listings_urls', {
        body: last10,
        contentType: 'text/plain',
      });
      throw err;
    }

    // Pan the map slightly to reveal the Search this area button
    const canvas = page.locator('.mapboxgl-canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Map canvas not found');
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 80, centerY);
    await page.mouse.up();

    // Search this area should fetch with the new cities param
    const searchThisArea = page.getByRole('button', { name: /search this area/i });
    await expect(searchThisArea).toBeVisible({ timeout: 10000 });
    const urlBefore = page.url();
    listingsUrls = [];
    await searchThisArea.click();

    await expect
      .poll(
        () => listingsUrls.length,
        { timeout: 10000 },
      )
      .toBeGreaterThan(0);

    try {
      expect(listingsUrls.some((url) => url.includes('cities=Testville'))).toBe(true);
    } catch (err) {
      const last10 = listingsUrls.slice(-10).join('\n') || 'no /api/listings requests captured';
      await test.info().attach('last_api_listings_urls', {
        body: last10,
        contentType: 'text/plain',
      });
      throw err;
    }

    await expect.poll(() => page.url(), { timeout: 5000 }).not.toBe(urlBefore);

    const last10 = listingsUrls.slice(-10).join('\n') || 'no /api/listings requests captured';
    await test.info().attach('last_api_listings_urls', {
      body: last10,
      contentType: 'text/plain',
    });
  });
});
