import express from 'express';
import cors from 'cors';

import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import healthRoutes from './routes/health.routes.js';
import lostFoundRoutes from './routes/lostFound.routes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

const configuredOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors(configuredOrigins.length > 0 ? { origin: configuredOrigins } : undefined));
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Smart Campus Service Portal API',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
