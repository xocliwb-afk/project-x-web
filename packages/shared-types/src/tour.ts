/**
 * Input provided by the client for a single tour stop.
 */
export type TourStopInput = {
  listingId: string;
  mlsId: string;
  fullAddress: string;
  showingDurationMinutes: number; // default 30 on the client side
};

/**
 * Request payload for planning a tour.
 */
export type PlanTourRequest = {
  stops: TourStopInput[];
  startTime: string; // ISO datetime, UTC assumed
  travelTimeMinutes: number;
};

/**
 * A planned stop with computed start and end times.
 */
export type TourStop = TourStopInput & {
  startTime: string;
  endTime: string;
};

/**
 * The fully planned tour returned by the backend.
 */
export type PlannedTour = {
  stops: TourStop[];
  googleMapsUrl: string;
  totalDurationMinutes: number;
  startTime: string;
  endTime: string;
};
