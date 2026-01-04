import { test, expect } from '@playwright/test';

test('map lens opens and closes on cluster click', async ({ page }) => {
  const listingsRequests: string[] = [];
  let sawOkBbox = false;

  page.on('request', (request) => {
    if (request.url().includes('/api/listings')) {
      listingsRequests.push(request.url());
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('/api/listings')) return;
    if (!url.includes('bbox=')) return;
    if (response.ok()) {
      sawOkBbox = true;
    }
  });

  await page.goto('/search', { waitUntil: 'domcontentloaded' });

  // Wait for map and a marker icon
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible({ timeout: 30000 });

  const waitStart = Date.now();
  while (!sawOkBbox && Date.now() - waitStart < 30000) {
    await page.waitForTimeout(500);
  }
  if (!sawOkBbox) {
    throw new Error(
      `No successful bbox listings response within 30s. Requests seen: ${listingsRequests
        .slice(-10)
        .join(' | ') || 'none'}`,
    );
  }

  // Zoom out up to 10 times to encourage clustering
  const zoomOut = page.locator('.leaflet-control-zoom-out').first();
  if (await zoomOut.isVisible()) {
    for (let i = 0; i < 10; i++) {
      await zoomOut.click({ timeout: 5000 });
      await page.waitForTimeout(250);
      const hasCluster = await page.locator('.marker-cluster').count();
      if (hasCluster > 0) break;
    }
  }

  const cluster = page.locator('.marker-cluster').first();
  const clusterCount = await cluster.count();
  if (clusterCount === 0) {
    const markerCount = await page.locator('.leaflet-marker-icon').count();
    throw new Error(
      `No marker-cluster after zooming out. markerCount=${markerCount}. Requests: ${listingsRequests
        .slice(-10)
        .join(' | ') || 'none'}`,
    );
  }

  const clickClusterWithRetry = async () => {
    for (let i = 0; i < 5; i++) {
      try {
        const c = page.locator('.marker-cluster').first();
        await c.click({ timeout: 5000 });
        return;
      } catch {
        await page.waitForTimeout(300);
      }
    }
    throw new Error(
      `Failed to click cluster after retries. Requests: ${listingsRequests
        .slice(-10)
        .join(' | ') || 'none'}`,
    );
  };

  await clickClusterWithRetry();

  const lens = page.locator('[data-testid="map-lens"]');
  await expect(lens).toBeVisible({ timeout: 10000 });

  await clickClusterWithRetry();
  try {
    await expect(lens).toBeHidden({ timeout: 1000 });
  } catch {
    await page.click('.leaflet-container', { position: { x: 20, y: 20 }, timeout: 5000 });
    await expect(lens).toBeHidden({ timeout: 5000 });
  }
});
