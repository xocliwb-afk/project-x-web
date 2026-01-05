import type mapboxgl from 'mapbox-gl';

export const round5 = (value: number) => Math.round(value * 1e5) / 1e5;

export type BboxResult = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  bbox: string;
};

export const buildBboxFromBounds = (
  bounds: mapboxgl.LngLatBounds,
): BboxResult => {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const swLat = round5(sw.lat);
  const swLng = round5(sw.lng);
  const neLat = round5(ne.lat);
  const neLng = round5(ne.lng);

  return {
    swLat,
    swLng,
    neLat,
    neLng,
    bbox: `${swLng},${swLat},${neLng},${neLat}`,
  };
};
