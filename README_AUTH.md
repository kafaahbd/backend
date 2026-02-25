# User Authentication Integration Guide

This project now includes a full Node.js + Express backend with PostgreSQL support for user registration and login.

## Backend Structure
- `server.ts`: Main entry point with Express and Vite middleware.
- `src/server/db/index.ts`: PostgreSQL connection pool.
- `src/server/controllers/authController.ts`: Logic for registration, login, and profile fetching.
- `src/server/routes/authRoutes.ts`: API endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/profile`).
- `src/server/middleware/auth.ts`: JWT authentication middleware.

## Database Setup
You need a PostgreSQL database. Run the following SQL to set up the table:

```sql
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
```

## Frontend Integration (React)

### 1. Registration Example
```tsx
import { registerUser } from './services/authService';

const handleRegister = async (formData) => {
  try {
    const response = await registerUser(formData);
    console.log('Success:', response.message);
  } catch (error) {
    console.error('Registration failed:', error.response?.data?.message || error.message);
  }
};
```

### 2. Login Example
```tsx
import { loginUser } from './services/authService';

const handleLogin = async (identifier, password) => {
  try {
    const response = await loginUser({ identifier, password });
    console.log('Logged in as:', response.user.name);
    // Redirect user or update state
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message || error.message);
  }
};
```

### 3. Protected Route / Profile
```tsx
import { getUserProfile } from './services/authService';

useEffect(() => {
  const fetchProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUser(profile);
    } catch (error) {
      // Handle unauthorized
    }
  };
  fetchProfile();
}, []);
```

## Environment Variables
Make sure to set these in your `.env` file:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
