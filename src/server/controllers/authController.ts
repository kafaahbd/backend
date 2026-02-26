import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { sendVerificationEmail } from '../../services/emailService.js';
import crypto from 'crypto';

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

    // Generate verification token (24 hours expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save token to database
    await query(
      `INSERT INTO verification_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [newUser.rows[0].id, token, expiresAt]
    );

    // Send verification email
    await sendVerificationEmail(email, token, name);

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      user: newUser.rows[0]
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ==================== ইমেল ভেরিফিকেশন ====================
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;

  try {
    // Find valid token (not expired)
    const tokenResult = await query(
      `SELECT vt.*, u.email, u.verified 
       FROM verification_tokens vt
       JOIN users u ON vt.user_id = u.id
       WHERE vt.token = $1 AND vt.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const { user_id, email } = tokenResult.rows[0];

    // Update user as verified
    await query(
      `UPDATE users SET verified = true, verified_at = NOW() WHERE id = $1`,
      [user_id]
    );

    // Delete used token
    await query(`DELETE FROM verification_tokens WHERE token = $1`, [token]);

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (error: any) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// ==================== ভেরিফিকেশন ইমেল রিসেন্ড ====================
export const resendVerification = async (req: Request, res: Response) => {
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

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Delete old tokens
    await query('DELETE FROM verification_tokens WHERE user_id = $1', [user.id]);

    // Save new token
    await query(
      'INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Send email
    await sendVerificationEmail(email, token, user.name);

    res.json({ message: 'Verification email resent. Please check your inbox.' });
  } catch (error: any) {
    console.error('Resend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== লগইন ====================
export const login = async (req: Request, res: Response) => {
  const { identifier, password } = req.body; // identifier can be username or email

  try {
    // Find user by email or username
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

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    // Remove password from response
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