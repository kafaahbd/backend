import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { sendVerificationCode } from '../../services/emailService.js';

// ৬-ডিজিটের র‍্যান্ডম কোড জেনারেটর
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==================== রেজিস্ট্রেশন ====================
export const register = async (req: Request, res: Response) => {
  const { username, name, email, phone, study_level, group, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user with verified = false
    const newUser = await query(
      `INSERT INTO users (username, name, email, phone, study_level, "group", password, verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, false) 
       RETURNING id, username, name, email`,
      [username, name, email, phone, study_level, group, hashedPassword]
    );

    // Generate 6-digit verification code
    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // ১৫ মিনিট validity

    // Save code to database
    await query(
      `INSERT INTO verification_codes (user_id, code, expires_at) 
       VALUES ($1, $2, $3)`,
      [newUser.rows[0].id, code, expiresAt]
    );

    // Send verification email with code
    await sendVerificationCode(email, code, name);

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification code.',
      userId: newUser.rows[0].id,
      email: email
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ==================== কোড ভেরিফিকেশন ====================
export const verifyCode = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  try {
    // Find user by email
    const userResult = await query('SELECT id, verified FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Find valid code
    const codeResult = await query(
      `SELECT * FROM verification_codes 
       WHERE user_id = $1 AND code = $2 AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Update user as verified
    await query(
      `UPDATE users SET verified = true, verified_at = NOW() WHERE id = $1`,
      [user.id]
    );

    // Delete used code
    await query(`DELETE FROM verification_codes WHERE id = $1`, [codeResult.rows[0].id]);

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (error: any) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// ==================== কোড রিসেন্ড ====================
export const resendCode = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // Find user
    const userResult = await query('SELECT id, name, verified FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Delete old codes
    await query('DELETE FROM verification_codes WHERE user_id = $1', [user.id]);

    // Save new code
    await query(
      'INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
      [user.id, code, expiresAt]
    );

    // Send email with new code
    await sendVerificationCode(email, code, user.name);

    res.json({ message: 'Verification code resent. Please check your inbox.' });
  } catch (error: any) {
    console.error('Resend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== লগইন ====================
export const login = async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1 OR username = $2', [identifier, identifier]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.verified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in',
        needsVerification: true,
        email: user.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ==================== প্রোফাইল ====================
export const getProfile = async (req: any, res: Response) => {
  try {
    const result = await query(
      `SELECT id, username, name, email, phone, study_level, "group", created_at, verified, verified_at 
       FROM users WHERE id = $1`, 
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};