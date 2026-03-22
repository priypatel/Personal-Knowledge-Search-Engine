import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middlewares/error.middleware.js';
import { requireAuth } from './middlewares/auth.middleware.js';
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

// Protected routes
app.use('/api', requireAuth, uploadRoutes);
app.use('/api', chatRoutes);          // requireAuth applied inside chat router
app.use('/api', requireAuth, suggestionRoutes);

app.use(errorMiddleware);

export default app;
