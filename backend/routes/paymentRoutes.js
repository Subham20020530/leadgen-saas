import express from 'express';
import { createCheckoutSession, handleWebhook } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Protected: Create Checkout
router.post('/create-checkout-session', requireAuth, createCheckoutSession);

// Public: Webhook (Middleware is handled in server.js to preserve raw body)
router.post('/webhook', handleWebhook);

export default router;
