import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import errorMiddleware from './middlewares/error.middleware.js';
import uploadRoutes from './routes/upload.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api', uploadRoutes);

app.use(errorMiddleware);

export default app;
