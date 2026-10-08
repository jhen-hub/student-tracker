import express from 'express';
const router = express.Router();
import { pool } from '../../db.js';

// GET /api/notifications - List all notifications
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications - Create a new notification
router.post('/', async (req, res, next) => {
  try {
    const { title, message, notification_date, read } = req.body;

    // Basic validation
    if (!title || !notification_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.query(
      'INSERT INTO notifications (title, message, notification_date, read) VALUES (?, ?, ?, ?)',
      [title, message || null, notification_date, read !== undefined ? read : false]
    );

    const [newNotification] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    res.status(201).json(newNotification[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id - Update notification by ID
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;

    // Define allowed fields based on schema.sql
    const ALLOWED = ['title', 'message', 'notification_date', 'read'];

    // Check for unknown fields
    const unknown = Object.keys(updates).filter(k => !ALLOWED.includes(k));
    if (unknown.length > 0) {
      return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}` });
    }

    // Check if there are any valid fields to update
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Build SET clause safely using only allowed fields
    const setClause = fields.map(f => `\`${f}\` = ?`).join(', ');

    const [result] = await pool.query(
      `UPDATE notifications SET ${setClause} WHERE id = ?`,
      [...fields.map(field => updates[field]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const [updatedNotification] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id]);
    res.json(updatedNotification[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notifications/:id - Delete notification by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;