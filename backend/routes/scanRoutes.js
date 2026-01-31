import express from 'express';
import { startScan, getScanStatus } from '../controllers/scanController.js';

const router = express.Router();

router.post('/scan', startScan);
router.get('/scan/:jobId', getScanStatus);

export default router;
