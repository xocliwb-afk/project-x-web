'use client';

import { create } from 'zustand';
import {
  NormalizedListing,
  PlanTourRequest,
  PlannedTour,
  TourStopInput,
} from '@project-x/shared-types';

type TourStoreState = {
  stops: TourStopInput[];
  startTime: string | null;
  travelTimeMinutes: number;
  showingDurationMinutes: number;
  plannedTour: PlannedTour | null;
  isLoading: boolean;
  error: string | null;
  addStop: (listing: NormalizedListing) => void;
  removeStop: (listingId: string) => void;
  setStartTime: (value: string | null) => void;
  setTravelTimeMinutes: (minutes: number) => void;
  planTour: () => Promise<void>;
  clearTour: () => void;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  'http://localhost:3001';

export const useTourStore = create<TourStoreState>((set, get) => ({
  stops: [],
  startTime: null,
  travelTimeMinutes: 15,
  showingDurationMinutes: 30,
  plannedTour: null,
  isLoading: false,
  error: null,
  addStop: (listing) => {
    const { stops, showingDurationMinutes } = get();
    const exists = stops.some((stop) => stop.listingId === listing.id);
    if (exists) return;
    const nextStop: TourStopInput = {
      listingId: listing.id,
      mlsId: listing.mlsId,
      fullAddress: listing.address.full,
      showingDurationMinutes,
    };
    set({ stops: [...stops, nextStop], plannedTour: null, error: null });
  },
  removeStop: (listingId) => {
    const filtered = get().stops.filter((stop) => stop.listingId !== listingId);
    set({ stops: filtered });
  },
  setStartTime: (value) => {
    set({ startTime: value });
  },
  setTravelTimeMinutes: (minutes) => {
    if (Number.isNaN(minutes) || minutes < 0) return;
    set({ travelTimeMinutes: minutes });
  },
  planTour: async () => {
    const { stops, startTime, travelTimeMinutes } = get();

    if (!startTime) {
      set({ error: 'Start time is required to plan a tour.' });
      return;
    }

    const payload: PlanTourRequest = {
      stops,
      startTime,
      travelTimeMinutes,
    };

    set({ isLoading: true, error: null });

    try {
      const res = await fetch(`${API_BASE}/api/v1/tours/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message =
          (errorBody as any)?.message ||
          `Failed to plan tour (${res.status})`;
        set({ error: message, isLoading: false });
        return;
      }

      const data = (await res.json()) as { tour: PlannedTour };
      set({ plannedTour: data.tour, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.message ?? 'Unexpected error while planning tour.',
        isLoading: false,
      });
    }
  },
  clearTour: () => {
    set({
      plannedTour: null,
      stops: [],
      error: null,
      isLoading: false,
    });
  },
}));