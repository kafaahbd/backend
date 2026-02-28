import cron from 'node-cron';
import { query } from '../db/index.js';

// প্রতিদিন রাত ২টায় চালান (আপনার সময় অনুযায়ী)
cron.schedule('0 * * * *', async () => { // Proti ghontay check korbe
  console.log('🧹 Cleaning up unverified accounts (1h limit)...');
  try {
    const result = await query(
      `DELETE FROM users 
       WHERE verified = false 
       AND created_at < NOW() - INTERVAL '1 hour'`
    );
    console.log(`✅ Deleted ${result.rowCount} expired unverified accounts.`);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
});