import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/error.middleware.js';
import { optionalAuth } from './middlewares/auth.middleware.js';
import authRoutes from './routes/auth.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import chatRoutes from './routes/chat.routes.js';
import suggestionRoutes from './routes/suggestion.routes.js';
import { NODE_ENV } from './config/env.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check (public)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Auth routes (public — register, login; protected — logout, me)
app.use('/api', authRoutes);

// Upload: guests can upload (document stored with null userId)
app.use('/api', optionalAuth, uploadRoutes);
// Chat: requireAuth applied per-route inside chat router
app.use('/api', chatRoutes);
// Suggestions: no user context needed
app.use('/api', optionalAuth, suggestionRoutes);

app.use(errorMiddleware);

export default app;
