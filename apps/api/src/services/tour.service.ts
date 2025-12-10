import {
  PlanTourRequest,
  PlannedTour,
  TourStop,
} from '@project-x/shared-types';

export class TourService {
  planTour(request: PlanTourRequest): PlannedTour {
    const start = new Date(request.startTime);

    if (Number.isNaN(start.getTime())) {
      throw new Error('Invalid startTime provided');
    }

    const stops: TourStop[] = [];
    let currentStart = start;

    for (const stop of request.stops) {
      const stopStart = currentStart;
      const stopEnd = new Date(
        stopStart.getTime() + stop.showingDurationMinutes * 60_000,
      );

      stops.push({
        ...stop,
        startTime: stopStart.toISOString(),
        endTime: stopEnd.toISOString(),
      });

      currentStart = new Date(
        stopEnd.getTime() + request.travelTimeMinutes * 60_000,
      );
    }

    const tourStartTime = start.toISOString();
    const tourEndTime =
      stops.length > 0
        ? stops[stops.length - 1].endTime
        : start.toISOString();
    const totalDurationMinutes =
      stops.length > 0
        ? Math.max(
            0,
            Math.round(
              (new Date(tourEndTime).getTime() - start.getTime()) / 60_000,
            ),
          )
        : 0;

    return {
      stops,
      googleMapsUrl: this.buildGoogleMapsUrl(request),
      totalDurationMinutes,
      startTime: tourStartTime,
      endTime: tourEndTime,
    };
  }

  private buildGoogleMapsUrl(request: PlanTourRequest): string {
    if (!request.stops || request.stops.length === 0) {
      return '';
    }

    const addresses = request.stops.map((s) => s.fullAddress);

    if (addresses.length === 1) {
      const destination = encodeURIComponent(addresses[0]);
      return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }

    const origin = encodeURIComponent(addresses[0]);
    const destination = encodeURIComponent(addresses[addresses.length - 1]);
    const middle = addresses.slice(1, -1);
    const waypointParam =
      middle.length > 0
        ? `&waypoints=${middle.map((addr) => encodeURIComponent(addr)).join('|')}`
        : '';

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointParam}`;
  }
}
