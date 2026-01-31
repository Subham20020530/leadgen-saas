import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

// Middleware ensuring the user is authenticated via Clerk
export const requireAuth = ClerkExpressRequireAuth();

// Optional: Middleware to extract user but not block (for public/mixed routes)
export const optionalAuth = ClerkExpressRequireAuth({ loose: true });
