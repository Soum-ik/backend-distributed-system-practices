import { Router } from 'express';
import { postsController } from './posts.controller.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';

const router = Router();

router.post('/', asyncHandler(postsController.create));
router.get('/feed', asyncHandler(postsController.feed));
router.get('/author/:authorId', asyncHandler(postsController.listByAuthor));
router.get('/:id', asyncHandler(postsController.getById));
router.delete('/:id', asyncHandler(postsController.remove));
router.post('/:id/like', asyncHandler(postsController.like));
router.delete('/:id/like', asyncHandler(postsController.unlike));

export default router;
