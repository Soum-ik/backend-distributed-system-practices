import { Router } from 'express';
import { postsController } from './posts.controller.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { authenticate } from '../../middlewares/authenticate.ts';

const router = Router();

router.post('/', asyncHandler(authenticate), asyncHandler(postsController.create));
router.get('/feed', asyncHandler(authenticate), asyncHandler(postsController.feed));
router.get('/author/:authorId', asyncHandler(postsController.listByAuthor));
router.get('/:id', asyncHandler(postsController.getById));
router.delete('/:id', asyncHandler(authenticate), asyncHandler(postsController.remove));
router.post('/:id/like', asyncHandler(authenticate), asyncHandler(postsController.like));
router.delete('/:id/like', asyncHandler(authenticate), asyncHandler(postsController.unlike));

export default router;
