import express from 'express';

import {
  claimItem,
  createItem,
  deleteItem,
  getItemById,
  listItems,
  updateItem,
  updateItemStatus,
} from '../controllers/lostFound.controller.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router
  .route('/')
  .post(authorizeRoles('student'), createItem)
  .get(listItems);

router.post('/:id/claim', authorizeRoles('student'), claimItem);

router
  .route('/:id/status')
  .patch(authorizeRoles('admin'), updateItemStatus);

router
  .route('/:id')
  .get(getItemById)
  .patch(updateItem)
  .delete(deleteItem);

export default router;
