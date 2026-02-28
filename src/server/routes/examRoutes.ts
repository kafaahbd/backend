import { Router } from 'express';
import { saveExamResult, getUserStats } from '../controllers/examController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Shobguloi protected route, token chara access kora jabe na
router.post('/save', authenticateToken, saveExamResult);
router.get('/stats', authenticateToken, getUserStats);

export default router;