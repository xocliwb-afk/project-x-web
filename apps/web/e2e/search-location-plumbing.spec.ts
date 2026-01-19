import { expect, test } from '@playwright/test';

const BBOX = '-86.74854,42.3342,-84.58548,43.58561';

const waitForListingsResponse = async (page: any, predicate: (url: string) => boolean, listingsUrls: string[]) => {
  try {
    const resp = await page.waitForResponse(
      (r: any) => r.url().includes('/api/listings') && r.request().method() === 'GET' && predicate(r.url()),
      { timeout: 30000 },
    );
    const json = await resp.json();
    return { url: resp.url(), json } as { url: string; json: any };
  } catch (e) {
    const last10 = listingsUrls.slice(-10).join('\n') || 'none';
    await test.info().attach('last_api_listings_urls', { body: last10, contentType: 'text/plain' });
    throw e;
  }
};

test.describe('Location plumbing via URL params', () => {
  test('cities and postalCodes propagate to list + pins', async ({ page }) => {
    let listingsUrls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/listings')) {
        listingsUrls.push(req.url());
      }
    });

    await page.goto(`/search?bbox=${encodeURIComponent(BBOX)}&searchToken=seed`);
    await page.waitForLoadState('domcontentloaded');

    const initial = await waitForListingsResponse(page, (u) => u.includes('limit=50'), listingsUrls);
    const first = initial.json?.results?.[0];
    const city: string | undefined = first?.address?.city;
    const zip: string | undefined = first?.address?.zip;
    if (!city || !zip) {
      test.fail(true, 'Missing city or zip in initial results to drive test deterministically');
      return;
    }

    // Navigate with cities filter
    listingsUrls = [];
    const cityToken = Date.now().toString();
    await page.goto(
      `/search?bbox=${encodeURIComponent(BBOX)}&searchToken=${cityToken}&cities=${encodeURIComponent(city)}`,
    );

    await expect
      .poll(
        () => listingsUrls.some((u) => u.includes('cities=') && u.includes('limit=50')),
        { timeout: 12000 },
      )
      .toBeTruthy();
    await expect
      .poll(
        () => listingsUrls.some((u) => u.includes('cities=') && u.includes('limit=500')),
        { timeout: 12000 },
      )
      .toBeTruthy();

    const cityResp = await waitForListingsResponse(
      page,
      (u) => u.includes('cities=') && u.includes('limit=50'),
      listingsUrls,
    );
    const cityResults: any[] = cityResp.json?.results ?? [];
    const cityMismatch = cityResults.slice(0, 10).find((r) => r?.address?.city !== city);
    if (cityMismatch) {
      const last10 = listingsUrls.slice(-10).join('\n') || 'none';
      await test.info().attach('last_api_listings_urls', { body: last10, contentType: 'text/plain' });
      throw new Error(`City filter mismatch: expected ${city}`);
    }

    // Navigate with postalCodes filter
    listingsUrls = [];
    const zipToken = Date.now().toString();
    await page.goto(
      `/search?bbox=${encodeURIComponent(BBOX)}&searchToken=${zipToken}&postalCodes=${encodeURIComponent(zip)}`,
    );

    await expect
      .poll(
        () => listingsUrls.some((u) => u.includes('postalCodes=') && u.includes('limit=50')),
        { timeout: 12000 },
      )
      .toBeTruthy();
    await expect
      .poll(
        () => listingsUrls.some((u) => u.includes('postalCodes=') && u.includes('limit=500')),
        { timeout: 12000 },
      )
      .toBeTruthy();

    const zipResp = await waitForListingsResponse(
      page,
      (u) => u.includes('postalCodes=') && u.includes('limit=50'),
      listingsUrls,
    );
    const zipResults: any[] = zipResp.json?.results ?? [];
    const zipMismatch = zipResults.slice(0, 10).find((r) => r?.address?.zip !== zip);
    if (zipMismatch) {
      const last10 = listingsUrls.slice(-10).join('\n') || 'none';
      await test.info().attach('last_api_listings_urls', { body: last10, contentType: 'text/plain' });
      throw new Error(`Zip filter mismatch: expected ${zip}`);
    }

    const last10 = listingsUrls.slice(-10).join('\n') || 'none';
    await test.info().attach('last_api_listings_urls', { body: last10, contentType: 'text/plain' });
  });
});
