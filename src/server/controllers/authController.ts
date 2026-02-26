import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

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
    
    // Insert user
    const newUser = await query(
      'INSERT INTO users (username, name, email, phone, study_level, "group", password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, name, email',
      [username, name, email, phone, study_level, group, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { identifier, password } = req.body; // identifier can be username or email

  try {
    // Find user by email or username
    const result = await query('SELECT * FROM users WHERE email = $1 OR username = $2', [identifier, identifier]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
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

export const getProfile = async (req: any, res: Response) => {
  try {
    const result = await query('SELECT id, username, name, email, phone, study_level, "group", created_at FROM users WHERE id = $1', [req.user.id]);
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
