import { Router } from 'express';
import { analyticsController } from './analytics.controller.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';

const router = Router();

router.post('/events', asyncHandler(analyticsController.track));
router.get('/overview', asyncHandler(analyticsController.overview));
router.get('/timeseries', asyncHandler(analyticsController.timeseries));
router.get('/top-authors', asyncHandler(analyticsController.topAuthors));

export default router;
