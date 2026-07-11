import { Router } from 'express';
import { searchController } from './search.controller.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';

const router = Router();

router.get('/', asyncHandler(searchController.all));
router.get('/users', asyncHandler(searchController.users));
router.get('/posts', asyncHandler(searchController.posts));

export default router;
