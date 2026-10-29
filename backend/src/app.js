import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import guidelineRoutes from './routes/guidelineRoutes.js';
import factRoutes from './routes/factRoutes.js';
import terminologyRoutes from './routes/terminologyRoutes.js';
import visualAssetRoutes from './routes/visualAssetRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { protect } from './middleware/authMiddleware.js';
import { authorize } from './middleware/roleMiddleware.js';
import { verifyOrgAccess } from './middleware/orgMiddleware.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173', // Vite default port if frontend uses it
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers with controlled payload size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (skip during testing to keep test output clean)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Root ping
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to BrandDNA API. Visit /api/health for system status.',
    docs: '/api/health',
  });
});

// Health check endpoint
app.use('/api/health', healthRoutes);

// Authentication & authorization endpoints
app.use('/api/auth', authRoutes);

// Brand workspace and brand knowledge base endpoints
app.use('/api/brands', brandRoutes);
app.use('/api/guidelines', guidelineRoutes);
app.use('/api/facts', factRoutes);
app.use('/api/terminology', terminologyRoutes);
app.use('/api/visual-assets', visualAssetRoutes);

// Content review pipeline endpoints (Phase 4)
app.use('/api/reviews', reviewRoutes);

// In-app notifications (Phase 5)
app.use('/api/notifications', notificationRoutes);

// Test routes for middleware verification (active only during automated test runs)
if (process.env.NODE_ENV === 'test') {
  app.get('/api/test-admin-only', protect, authorize('admin'), (req, res) => {
    res.json({ success: true, message: 'Welcome Admin' });
  });

  app.get('/api/test-org-protected/:orgId', protect, verifyOrgAccess(), (req, res) => {
    res.json({ success: true, message: 'Org access granted' });
  });
}

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;
