import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema } from '../utils/validation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);
router.put('/change-password', authenticate, AuthController.changePassword);
router.post('/refresh-token', authenticate, AuthController.refreshToken);

// Admin routes
router.get('/users', authenticate, authorize('admin'), AuthController.getAllUsers);
router.patch('/users/:userId/deactivate', authenticate, authorize('admin'), AuthController.deactivateUser);

export default router;