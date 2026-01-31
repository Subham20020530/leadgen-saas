import express from 'express';
import { getDashboardStats } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', requireAuth, getDashboardStats);

export default router;
