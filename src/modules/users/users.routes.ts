import { Router } from 'express';
import { usersController } from './users.controller.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';

const router = Router();

router.post('/', asyncHandler(usersController.create));
router.get('/', asyncHandler(usersController.list));
router.get('/username/:username', asyncHandler(usersController.getByUsername));
router.get('/:id', asyncHandler(usersController.getById));
router.patch('/:id', asyncHandler(usersController.update));

export default router;
