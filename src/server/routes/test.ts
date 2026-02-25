import { Router } from 'express';
import { query } from '../db';

const router = Router();

router.get('/test-db', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0] });
  } catch (error) {
    console.error('DB test error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;