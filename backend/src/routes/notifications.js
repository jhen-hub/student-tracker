import { Router } from 'express';
import { pool } from '../../db.js';
import { sendToUsers } from '../services/pushService.js';

const router = Router();

// ---------- Helpers ----------

async function nextNotificationId() {
  const [[{ maxId }]] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id, 7) AS UNSIGNED)) AS maxId FROM notifications WHERE id LIKE 'NOTIF-%'"
  );
  const next = maxId ? parseInt(maxId) + 1 : 1;
  return `NOTIF-${next.toString().padStart(3, '0')}`;
}

async function resolveRecipients(type, value) {
  if (type === 'All') {
    const [rows] = await pool.query("SELECT id FROM users WHERE status = 'Active'");
    return rows.map((r) => r.id);
  }
  if (type === 'Role') {
    if (!['Admin', 'Staff', 'Student'].includes(value)) return [];
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE role = ? AND status = 'Active'",
      [value]
    );
    return rows.map((r) => r.id);
  }
  if (type === 'User') {
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND status = 'Active'",
      [value]
    );
    return rows.map((r) => r.id);
  }
  return [];
}

// ---------- Routes ----------

// GET /api/notifications?user_id=USR-001
// Without user_id, returns everything (admin/debug view).
router.get('/', async (req, res, next) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      const [rows] = await pool.query(
        'SELECT * FROM notifications ORDER BY notification_date DESC, created_at DESC'
      );
      return res.json(rows);
    }

    const [[viewer]] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [user_id]
    );
    if (!viewer) {
      return res.status(400).json({ error: 'Unknown user_id' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM notifications
        WHERE recipient_type = 'All'
           OR (recipient_type = 'Role' AND recipient_value = ?)
           OR (recipient_type = 'User' AND recipient_value = ?)
        ORDER BY notification_date DESC, created_at DESC`,
      [viewer.role, viewer.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body must be JSON' });
    }

    const { title, message } = req.body;
    const recipient_type = req.body.recipient_type || 'All';
    const recipient_value = req.body.recipient_value || null;

    if (!title) {
      return res.status(400).json({ error: 'Missing required field: title' });
    }
    if (!['All', 'Role', 'User'].includes(recipient_type)) {
      return res.status(400).json({ error: 'recipient_type must be All, Role, or User' });
    }
    if (recipient_type === 'Role' && !['Admin', 'Staff', 'Student'].includes(recipient_value)) {
      return res.status(400).json({ error: 'recipient_value must be Admin, Staff, or Student' });
    }
    if (recipient_type === 'User' && !recipient_value) {
      return res.status(400).json({ error: 'recipient_value (user id) is required for User recipient_type' });
    }

    const notification_date =
      req.body.notification_date || new Date().toISOString().slice(0, 10);
    const read = req.body.read !== undefined ? !!req.body.read : false;

    const id = await nextNotificationId();

    await pool.query(
      'INSERT INTO notifications (id, recipient_type, recipient_value, title, message, notification_date, `read`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, recipient_type, recipient_value, title, message || null, notification_date, read]
    );

    const [newNotification] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );

    // Fire-and-forget push, with loud logging at every decision point.
    (async () => {
      try {
        const userIds = await resolveRecipients(recipient_type, recipient_value);
        console.log(`[push] ${id}: resolved recipients →`, userIds);

        if (userIds.length === 0) {
          console.log(`[push] ${id}: no user matched (${recipient_type}/${recipient_value})`);
          return;
        }

        const targetUrl =
          recipient_type === 'Role' && recipient_value === 'Student'
            ? '/student/requirements'
            : '/notifications';

        await sendToUsers(userIds, {
          title,
          body: message || 'New notification from the registrar.',
          url: targetUrl,
          tag: `notification-${id}`,
        });

        console.log(`[push] ${id}: dispatched to ${userIds.length} user(s)`);
      } catch (pushErr) {
        console.error('[push] failed for notification', id, pushErr);
      }
    })();

    res.status(201).json(newNotification[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A notification with that id already exists' });
    }
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    delete updates.id;
    delete updates.created_at;

    const ALLOWED = ['title', 'message', 'notification_date', 'read'];

    const unknown = Object.keys(updates).filter((k) => !ALLOWED.includes(k));
    if (unknown.length > 0) {
      return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}` });
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = fields.map((f) => `\`${f}\` = ?`).join(', ');
    const [result] = await pool.query(
      `UPDATE notifications SET ${setClause} WHERE id = ?`,
      [...fields.map((f) => updates[f]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM notifications WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;