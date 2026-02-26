import cron from 'node-cron';
import { query } from '../db/index.js';

// প্রতিদিন রাত ২টায় চালান (আপনার সময় অনুযায়ী)
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 Cleaning up unverified accounts...');
  try {
    // ২৪ ঘণ্টার বেশি পুরনো আনভেরিফাইড ইউজার ডিলিট
    const result = await query(
      `DELETE FROM users 
       WHERE verified = false 
       AND created_at < NOW() - INTERVAL '24 hours'`
    );
    console.log(`✅ Deleted ${result.rowCount} unverified accounts.`);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
});