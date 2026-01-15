import { test, expect } from './fixtures';

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

  // Wait for Mapbox map and canvas to be ready
  const mapCanvas = page.locator('.mapboxgl-canvas');
  await expect(page.locator('.mapboxgl-map')).toBeVisible({ timeout: 30000 });
  await expect(mapCanvas).toBeVisible({ timeout: 30000 });

  // Zoom out several times to encourage clustering/overlap
  await mapCanvas.hover();
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(150);
  }

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

  // Attempt clicks on multiple canvas positions until lens opens
  const lens = page.locator('[data-testid="map-lens"]');
  const clickPositions: Array<{ x: number; y: number }> = [
    { x: 0.5, y: 0.5 },
    { x: 0.3, y: 0.3 },
    { x: 0.7, y: 0.3 },
    { x: 0.3, y: 0.7 },
    { x: 0.7, y: 0.7 },
  ];

  const clickCanvasAt = async (relX: number, relY: number) => {
    const box = await mapCanvas.boundingBox();
    if (!box) throw new Error('Map canvas bounding box unavailable');
    await mapCanvas.click({
      position: { x: box.width * relX, y: box.height * relY },
      timeout: 5000,
    });
  };

  let opened = false;
  for (const pos of clickPositions) {
    await clickCanvasAt(pos.x, pos.y);
    try {
      await expect(lens).toBeVisible({ timeout: 5000 });
      await expect(lens.locator("canvas.mapboxgl-canvas")).toBeVisible({ timeout: 10000 });
      opened = true;
      break;
    } catch {
      // Try another position
    }
  }

  if (!opened) {
    throw new Error(
      `Lens did not become visible after canvas clicks. Requests: ${listingsRequests
        .slice(-10)
        .join(' | ') || 'none'}`,
    );
  }

  // Dismiss lens
  await page.keyboard.press('Escape');
  await expect(lens).toBeHidden({ timeout: 5000 });
});
