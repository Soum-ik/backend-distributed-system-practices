import { Router } from 'express';
import { usersController } from './users.controller.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { authenticate } from '../../middlewares/authenticate.ts';

const router = Router();

router.get('/', asyncHandler(usersController.list));
router.get('/username/:username', asyncHandler(usersController.getByUsername));
router.get('/:id', asyncHandler(usersController.getById));
router.patch('/:id', asyncHandler(authenticate), asyncHandler(usersController.update));

export default router;
