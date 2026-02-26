import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? 'exists' : 'missing');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon-এর জন্যও প্রয়োজন
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

/**
 * SQL Schema for reference:
 * 
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  CREATE TYPE study_level_type AS ENUM ('SSC', 'HSC');
  CREATE TYPE group_type AS ENUM ('Science', 'Arts', 'Commerce');
  
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
   phone VARCHAR(20),
    study_level study_level_type NOT NULL,
    "group" group_type NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- ভেরিফিকেশন টোকেন সংরক্ষণের জন্য নতুন টেবিল
CREATE TABLE verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- users টেবিলে verified কলাম যোগ করুন
ALTER TABLE users ADD COLUMN verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
 */