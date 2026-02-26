import { Router } from 'express';
import { 
  register, login, getProfile, 
  verifyEmail, resendVerification 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

export default router;