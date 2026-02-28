import type { Request, Response } from 'express';
import { query } from '../db/index.js';

/**
 * ১. পরীক্ষার রেজাল্ট ডাটাবেজে সেভ করার ফাংশন
 */
export const saveExamResult = async (req: any, res: Response) => {
  // ফ্রন্টএন্ড থেকে পাঠানো ডাটা রিসিভ করা
  const { 
    subject_name, 
    score, 
    total_questions, 
    correct_answers, 
    wrong_answers, 
    time_taken 
  } = req.body;

  // authenticateToken middleware থেকে ইউজার আইডি নেওয়া
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User not found' });
  }

  try {
    /**
     * ডাটাবেজে ইনসার্ট করা। 
     * এখানে ?? (Nullish Coalescing) ব্যবহার করা হয়েছে যাতে 
     * কোনো কারণে score বা অন্য ডাটা null আসলে তা ০ হিসেবে সেভ হয়।
     */
    const result = await query(
      `INSERT INTO exam_results 
       (user_id, subject_name, score, total_questions, correct_answers, wrong_answers, time_taken)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        userId,
        subject_name || 'General',
        score ?? 0,              // আপনার এরর ফিক্স করার মেইন লাইন
        total_questions ?? 0,
        correct_answers ?? 0,
        wrong_answers ?? 0,
        time_taken ?? 0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Exam result saved successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error in saveExamResult controller:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while saving result',
      error: error.message 
    });
  }
};

/**
 * ২. ইউজারের সব পরীক্ষার হিস্ট্রি নিয়ে আসার ফাংশন
 */
export const getUserStats = async (req: any, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // ইউজারের আইডি অনুযায়ী সব রেজাল্ট ক্রমানুসারে (নতুনগুলো আগে) আনা
    const result = await query(
      `SELECT * FROM exam_results 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('Error in getUserStats controller:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching stats' 
    });
  }
};

/**
 * ৩. নির্দিষ্ট একটি পরীক্ষার বিস্তারিত তথ্য দেখার ফাংশন (অপশনাল)
 */
export const getExamDetails = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const result = await query(
      `SELECT * FROM exam_results WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Exam result not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
};