import { pool } from '../../db.js';
import { sendToRole } from './pushService.js';

/**
 * Count active students who have at least one Pending and/or one Missing
 * requirement, then push a summary to every Admin and Staff user.
 */
export async function sendAdminDigest() {
  const [[stats]] = await pool.query(`
    SELECT
      SUM(CASE WHEN pending_count > 0 THEN 1 ELSE 0 END) AS pending_students,
      SUM(CASE WHEN missing_count > 0 THEN 1 ELSE 0 END) AS missing_students
    FROM (
      SELECT
        sr.student_id,
        SUM(sr.status = 'Pending') AS pending_count,
        SUM(sr.status = 'Missing') AS missing_count
      FROM student_requirements sr
      JOIN students s ON s.id = sr.student_id
      WHERE s.status = 'Active'
      GROUP BY sr.student_id
    ) t
  `);

  const pending = Number(stats?.pending_students || 0);
  const missing = Number(stats?.missing_students || 0);

  if (pending === 0 && missing === 0) return;

  const payload = {
    title: 'Registrar — Compliance summary',
    body: `${pending} student${pending === 1 ? '' : 's'} with pending documents · ${missing} with missing documents`,
    url: '/dashboard',
    tag: 'admin-compliance-digest',
  };

  await Promise.allSettled([
    sendToRole('Admin', payload),
    sendToRole('Staff', payload),
  ]);
}