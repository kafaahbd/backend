import { Router } from 'express';
import { 
  register, login, getProfile, 
  verifyCode, resendCode 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-code', verifyCode);        // কোড ভেরিফিকেশন
router.post('/resend-code', resendCode);        // কোড রিসেন্ড

// Protected routes
router.get('/profile', authenticateToken, getProfile);

export default router;