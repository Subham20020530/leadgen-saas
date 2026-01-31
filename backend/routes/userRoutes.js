import express from 'express';
import { getMyProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', getMyProfile);
router.post('/me', getMyProfile); // Allow POST to pass email if needed

export default router;
