import { Router, Request, Response } from 'express';
import {
  ApiError,
  PlanTourRequest,
  PlannedTour,
  TourStopInput,
} from '@project-x/shared-types';
import { TourService } from '../services/tour.service';

const router = Router();
const tourService = new TourService();

const isValidStop = (stop: any): stop is TourStopInput => {
  return (
    stop &&
    typeof stop.listingId === 'string' &&
    typeof stop.mlsId === 'string' &&
    typeof stop.fullAddress === 'string' &&
    typeof stop.showingDurationMinutes === 'number' &&
    Number.isFinite(stop.showingDurationMinutes)
  );
};

const isValidRequest = (body: any): body is PlanTourRequest => {
  const validStart =
    typeof body?.startTime === 'string' &&
    !Number.isNaN(new Date(body.startTime).getTime());
  return (
    body &&
    validStart &&
    typeof body.travelTimeMinutes === 'number' &&
    Number.isFinite(body.travelTimeMinutes) &&
    Array.isArray(body.stops) &&
    body.stops.every((stop: any) => isValidStop(stop))
  );
};

router.post(
  '/plan',
  async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!isValidRequest(req.body)) {
        const error: ApiError = {
          error: true,
          message: 'Invalid request payload',
          code: 'INVALID_REQUEST',
          status: 400,
        };
        return res.status(400).json(error);
      }

      const tour: PlannedTour = tourService.planTour(req.body);
      return res.status(200).json({ tour });
    } catch (err: any) {
      const error: ApiError = {
        error: true,
        message: err?.message ?? 'Failed to plan tour',
        code: 'INTERNAL_ERROR',
        status: 500,
      };
      return res.status(500).json(error);
    }
  },
);

export default router;
