import express from 'express';

import {
  createComplaint,
  deleteComplaint,
  getComplaintById,
  listComplaints,
  updateComplaint,
  updateComplaintStatus,
} from '../controllers/complaint.controller.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router
  .route('/')
  .post(authorizeRoles('student'), createComplaint)
  .get(listComplaints);

router
  .route('/:id/status')
  .patch(authorizeRoles('admin'), updateComplaintStatus);

router
  .route('/:id')
  .get(getComplaintById)
  .patch(updateComplaint)
  .delete(deleteComplaint);

export default router;
