import cron from 'node-cron';
import { sendMissingReminders, sendPendingReminders } from '../services/reminderService.js';
import { sendAdminDigest } from '../services/digestService.js';

export function startScheduler() {
  // Every 3 hours on the hour: 00:00, 03:00, 06:00, ..., 21:00 server local.
  cron.schedule('0 */3 * * *', () => {
    sendMissingReminders().catch((err) => console.error('missing reminders failed:', err));
  });

  // Shifted 15 min so the two student pushes don't land in the same browser
  // moment (iOS coalesces same-second pushes).
  cron.schedule('15 */3 * * *', () => {
    sendPendingReminders().catch((err) => console.error('pending reminders failed:', err));
  });

  // Admin/Staff compliance digest once a day at 08:00.
  cron.schedule('0 8 * * *', () => {
    sendAdminDigest().catch((err) => console.error('admin digest failed:', err));
  });
}