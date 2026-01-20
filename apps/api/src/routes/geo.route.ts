import { Router } from 'express';
import fetch from 'node-fetch';
import { takeToken } from '../services/rateLimiter.service';

const router = Router();

type GeoCacheEntry = {
  result: any;
  expiresAt: number;
};

const cache = new Map<string, GeoCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_RPM = 60;

const normalizeQuery = (query: string) => query.trim().toLowerCase();

router.post('/geocode', async (req, res) => {
  try {
    const rawQuery = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    if (!rawQuery || rawQuery.length > 200) {
      return res.status(200).json({
        ok: false,
        code: 'INVALID_QUERY',
        error: 'Query required',
      });
    }

    const token = process.env.MAPBOX_GEOCODE_TOKEN;
    if (!token) {
      return res.status(200).json({
        ok: false,
        code: 'PROVIDER_NOT_CONFIGURED',
        error: 'Geocoding not configured',
      });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const rateKey = `geo:${ip}`;
    const rpm = Number(process.env.GEO_RATE_LIMIT_RPM) || DEFAULT_RPM;
    const { allowed, retryAfterSeconds } = takeToken(rateKey, rpm);
    if (!allowed) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        error: 'Too many requests',
      });
    }

    const cacheKey = normalizeQuery(rawQuery);
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ ok: true, result: cached.result });
    }

    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(rawQuery)}.json`,
    );
    url.searchParams.set('limit', '1');
    url.searchParams.set('types', 'place,postcode,address,region');
    url.searchParams.set('country', 'us');
    url.searchParams.set('access_token', token);

    const geoResp = await fetch(url.toString());
    if (!geoResp.ok) {
      return res.status(200).json({
        ok: false,
        code: 'PROVIDER_ERROR',
        error: 'Geocode provider error',
      });
    }
    const data = (await geoResp.json()) as any;
    const feature = Array.isArray(data?.features) ? data.features[0] : null;
    if (!feature) {
      return res.status(200).json({
        ok: false,
        code: 'NO_RESULTS',
        error: 'No results found',
      });
    }
    const bboxArr = Array.isArray(feature?.bbox) ? feature.bbox : null;
    const centerArr = Array.isArray(feature?.center) ? feature.center : null;
    if (!bboxArr || bboxArr.length !== 4 || !centerArr || centerArr.length !== 2) {
      return res.status(200).json({
        ok: false,
        code: 'NO_RESULTS',
        error: 'No results found',
      });
    }
    const bbox = bboxArr.join(',');
    const [centerLng, centerLat] = centerArr;
    const placeType = Array.isArray(feature.place_type) ? feature.place_type[0] : 'unknown';
    const type =
      placeType === 'place'
        ? 'city'
        : placeType === 'postcode'
        ? 'zip'
        : placeType === 'address'
        ? 'address'
        : placeType === 'region'
        ? 'region'
        : 'unknown';
    const displayName = feature.place_name ?? rawQuery;
    const result = {
      bbox,
      center: { lat: centerLat, lng: centerLng },
      displayName,
      type,
    };
    cache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json({ ok: true, result });
  } catch (err: any) {
    return res.status(200).json({
      ok: false,
      code: 'PROVIDER_ERROR',
      error: 'Geocode provider error',
    });
  }
});

export default router;
