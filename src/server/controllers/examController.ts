import type { Response } from 'express';
import { query } from '../db/index.js';

// Exam result save korar function
export const saveExamResult = async (req: any, res: Response) => {
  const { subject_name, score, total_questions, correct_answers, wrong_answers, time_taken } = req.body;
  const userId = req.user.id; // authenticateToken middleware theke asbe

  try {
    const result = await query(
      `INSERT INTO exam_results (user_id, subject_name, score, total_questions, correct_answers, wrong_answers, time_taken)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, subject_name, score, total_questions, correct_answers, wrong_answers, time_taken]
    );

    res.status(201).json({
      message: 'Exam result saved successfully',
      result: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error saving exam result:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User-er shob result niye ashar function
export const getUserStats = async (req: any, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM exam_results WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};