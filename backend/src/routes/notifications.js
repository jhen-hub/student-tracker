import { Router } from 'express';
import { pool } from '../../db.js';
import { sendToUsers } from '../services/pushService.js';
import { broadcastUpdate } from '../socket.js';

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

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    // Use session ID if available, fallback to query param
    const viewerId = req.session?.userId || req.query.user_id;

    if (!viewerId) {
      const [rows] = await pool.query(
        'SELECT * FROM notifications ORDER BY notification_date DESC, created_at DESC'
      );
      return res.json(rows);
    }

    const [[viewer]] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [viewerId]
    );
    if (!viewer) {
      return res.status(400).json({ error: 'Unknown user' });
    }

    // LEFT JOIN to check if this specific user read the notification
    const [rows] = await pool.query(
      `SELECT n.*, IF(nr.user_id IS NOT NULL, 1, 0) AS \`read\`
       FROM notifications n
       LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = ?
       WHERE n.recipient_type = 'All'
          OR (n.recipient_type = 'Role' AND n.recipient_value = ?)
          OR (n.recipient_type = 'User' AND n.recipient_value = ?)
       ORDER BY n.notification_date DESC, n.created_at DESC`,
      [viewerId, viewer.role, viewerId]
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
    
    const notification_date =
      req.body.notification_date || new Date().toISOString().slice(0, 10);

    const id = await nextNotificationId();

    await pool.query(
      'INSERT INTO notifications (id, recipient_type, recipient_value, title, message, notification_date) VALUES (?, ?, ?, ?, ?, ?)',
      [id, recipient_type, recipient_value, title, message || null, notification_date]
    );

    const [newNotification] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );

    broadcastUpdate(); // Live update for UI

    // Fire-and-forget push
    (async () => {
      try {
        const userIds = await resolveRecipients(recipient_type, recipient_value);
        if (userIds.length === 0) return;

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

// PATCH /api/notifications/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { read } = req.body;
    
    // Get user ID from session or body
    const viewerId = req.session?.userId || req.body.user_id;

    if (typeof read !== 'boolean' || !viewerId) {
      return res.status(400).json({ error: 'read (boolean) and user context are required' });
    }

    if (read) {
      // Mark as read (insert a row if it doesn't exist)
      await pool.query(
        'INSERT IGNORE INTO notification_reads (notification_id, user_id) VALUES (?, ?)',
        [id, viewerId]
      );
    } else {
      // Mark as unread (remove the row)
      await pool.query(
        'DELETE FROM notification_reads WHERE notification_id = ? AND user_id = ?',
        [id, viewerId]
      );
    }

    broadcastUpdate(); // Live update for UI

    // Return the specific user's updated view of the notification
    const [updated] = await pool.query(
      `SELECT n.*, IF(nr.user_id IS NOT NULL, 1, 0) AS \`read\`
       FROM notifications n
       LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = ?
       WHERE n.id = ?`,
      [viewerId, id]
    );

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
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
    broadcastUpdate();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;