import { pool } from '../../db.js';
import { sendToUsers } from './pushService.js';

// Every active user whose linked student has at least one requirement in the
// given status. DISTINCT because the JOIN matches one row per requirement.
async function usersWithStatus(status) {
  const [rows] = await pool.query(
    `SELECT DISTINCT u.id AS user_id
       FROM students s
       JOIN student_requirements sr ON sr.student_id = s.id
       JOIN users u ON u.student_id = s.id
      WHERE s.status = 'Active'
        AND sr.status = ?
        AND u.status = 'Active'`,
    [status]
  );
  return rows.map((r) => r.user_id);
}

export async function sendMissingReminders() {
  const userIds = await usersWithStatus('Missing');
  if (userIds.length === 0) return;

  await sendToUsers(userIds, {
    title: 'Missing documents',
    body: 'You still have missing requirements on file. Please submit them at the registrar.',
    url: '/student/requirements',
    tag: 'student-missing-reminder',
  });
}

export async function sendPendingReminders() {
  const userIds = await usersWithStatus('Pending');
  if (userIds.length === 0) return;

  await sendToUsers(userIds, {
    title: 'Pending documents',
    body: 'Some of your documents are still pending verification. Check your checklist for details.',
    url: '/student/requirements',
    tag: 'student-pending-reminder',
  });
}