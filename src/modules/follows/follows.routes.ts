import { Router } from 'express';
import { followsController } from './follows.controller.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';

// Mounted at /users/:id/... style semantics but kept as its own module.
const router = Router();

router.post('/:id/follow', asyncHandler(followsController.follow));
router.delete('/:id/follow', asyncHandler(followsController.unfollow));
router.get('/:id/followers', asyncHandler(followsController.followers));
router.get('/:id/following', asyncHandler(followsController.following));
router.get('/:id/counts', asyncHandler(followsController.counts));

export default router;
