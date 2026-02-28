import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './src/server/routes/authRoutes.js';
import testRoutes from './src/server/routes/test.js';
import './src/server/jobs/cleanupUnverified.js';
import examRoutes from './src/server/routes/examRoutes.js';

dotenv.config();


const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});
app.use('/api/exam', examRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});