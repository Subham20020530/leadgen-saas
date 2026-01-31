// server.js - Production Ready, Modular Backend
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from "dotenv";
import connectDB from './config/db.js';

// Route Imports
// Route Imports
import healthRoutes from './routes/healthRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
// Helper to remove trailing slash
const removeSlash = (url) => url ? url.replace(/\/$/, "") : "";

app.use(cors({
    origin: true, // Allow any origin (reflects the request origin)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // limit each IP to 200 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api', healthRoutes);
app.use('/api', paymentRoutes); // Includes Webhook (Public) and Checkout (Protected)

// Protected Routes
app.use('/api/users', requireAuth, userRoutes);
app.use('/api', requireAuth, scanRoutes);
app.use('/api', requireAuth, leadRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Server Error' : err.message
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Lead Gen API running on port ${PORT}`);
    console.log(`Ready to scrape REAL leads!\n`);
});
