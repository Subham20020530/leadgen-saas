// server.js - Production Ready, Modular Backend
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from "dotenv";
import connectDB from './config/db.js';

// Route Imports
import healthRoutes from './routes/healthRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import leadRoutes from './routes/leadRoutes.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173", process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // limit each IP to 200 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api', healthRoutes);
app.use('/api', scanRoutes);
app.use('/api', leadRoutes);

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
