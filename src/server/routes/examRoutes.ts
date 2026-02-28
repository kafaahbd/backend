import { Router } from 'express';
import { saveExamResult, getUserStats } from '../controllers/examController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ১. পরীক্ষার রেজাল্ট সেভ করার জন্য
// Endpoint: POST /api/exam/save
router.post('/save', authenticateToken, saveExamResult);

// ২. ইউজারের সব পরীক্ষার হিস্ট্রি পাওয়ার জন্য (ড্যাশবোর্ড এর জন্য)
// Endpoint: GET /api/exam/history
router.get('/history', authenticateToken, getUserStats);

// ৩. চাইলে আগের /stats ও রাখতে পারেন সামারির জন্য
router.get('/stats', authenticateToken, getUserStats);

export default router;