import { Router } from 'express';
import authRoutes from './authRoutes';
import courseRoutes from './courseRoutes';
import moduleRoutes from './moduleRoutes';
import lectureRoutes from './lectureRoutes';
import progressRoutes from './progressRoutes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/modules', moduleRoutes);
router.use('/lectures', lectureRoutes);
router.use('/progress', progressRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LMS API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API documentation route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to LMS API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      courses: '/api/courses',
      modules: '/api/modules',
      lectures: '/api/lectures',
      progress: '/api/progress',
      health: '/api/health',
    },
    documentation: 'Please refer to the Postman collection for detailed API documentation',
  });
});

export default router;