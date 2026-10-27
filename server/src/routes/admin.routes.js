import express from 'express';

import { getAnalytics, getUsers } from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken, authorizeRoles('admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);

export default router;
