/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import { mapSimplyRetsListing } from './simplyrets.mapper';

const sampleListing = {
  mlsId: 12345,
  listingId: 'abc-123',
  listPrice: 350000,
  photos: ['https://cdn.simplyrets.com/photo-1.jpg', 'https://cdn.simplyrets.com/photo-2.jpg'],
  address: {
    full: '123 Main St, Grand Rapids, MI 49503',
    streetNumberText: '123',
    streetName: 'Main St',
    city: 'Grand Rapids',
    state: 'MI',
    postalCode: '49503',
  },
  geo: {
    lat: 42.9634,
    lng: -85.6681,
  },
  property: {
    bedrooms: 3,
    bathsFull: 2,
    bathsHalf: 1,
    area: 1800,
    lotSizeArea: 0.25,
    yearBuilt: 1995,
    basement: ['Finished'],
    type: 'RES',
  },
  association: {
    fee: 250,
  },
  mls: {
    status: 'Active',
    daysOnMarket: 10,
    name: 'MichRIC',
  },
  disclaimer: 'Test disclaimer',
};

describe('mapSimplyRetsListing', () => {
  it('normalizes SimplyRETS payloads into the shared listing DTO', () => {
    const normalized = mapSimplyRetsListing(sampleListing, { requireCoordinates: true });

    expect(normalized).toBeTruthy();
    expect(normalized?.id).toBe(String(sampleListing.mlsId));
    expect(normalized?.listPrice).toBe(sampleListing.listPrice);
    expect(normalized?.listPriceFormatted).toBe('$350,000');
    expect(normalized?.address.full).toContain('123 Main St');
    expect(normalized?.address.lat).toBeCloseTo(sampleListing.geo.lat);
    expect(normalized?.media.photos).toHaveLength(2);
    expect(normalized?.media.thumbnailUrl).toBe(sampleListing.photos[0]);
    expect(normalized?.details.beds).toBe(sampleListing.property.bedrooms);
    expect(normalized?.details.baths).toBe(2.5);
    expect(normalized?.details.propertyType).toBe('Single Family');
    expect(normalized?.details.hoaFees).toBe(sampleListing.association.fee);
    expect(normalized?.details.status).toBe('FOR_SALE');
    expect(normalized?.meta.daysOnMarket).toBe(sampleListing.mls.daysOnMarket);
    expect(normalized?.attribution?.mlsName).toBe(sampleListing.mls.name);
    expect(normalized?.attribution?.disclaimer).toBe(sampleListing.disclaimer);
  });

  it('returns null for items without coordinates when coordinates are required', () => {
    const withoutCoords = {
      ...sampleListing,
      geo: { lat: null, lng: null },
    };

    const normalized = mapSimplyRetsListing(withoutCoords, { requireCoordinates: true });
    expect(normalized).toBeNull();
  });
});
