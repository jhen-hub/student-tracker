import cron from 'node-cron';
import { sendMissingReminders, sendPendingReminders } from '../services/reminderService.js';
import { sendAdminDigest } from '../services/digestService.js';

export function startScheduler() {
  // One wake per slot, three jobs per wake. Called at 08:00 and 20:00.
  async function runAll() {
    await Promise.allSettled([
      sendMissingReminders(),
      sendPendingReminders(),
      sendAdminDigest(),
    ]);
  }

  cron.schedule('0 8 * * *', () => {
    runAll().catch((err) => console.error('[scheduler] morning run failed:', err));
  });

  cron.schedule('0 20 * * *', () => {
    runAll().catch((err) => console.error('[scheduler] evening run failed:', err));
  });
}