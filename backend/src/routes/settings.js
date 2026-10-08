import express from 'express';
const router = express.Router();
import { pool } from '../../db.js';

// GET /api/settings - List all settings
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/settings/:key - Get setting by key
router.get('/:key', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE \`key\` = ?', [req.params.key]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/settings - Create a new setting
router.post('/', async (req, res, next) => {
  try {
    const { key, value } = req.body;

    // Basic validation
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.query(
      'INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?)',
      [key, value]
    );

    const [newSetting] = await pool.query('SELECT * FROM settings WHERE id = ?', [result.insertId]);
    res.status(201).json(newSetting[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Setting with this key already exists' });
    }
    next(err);
  }
});

// PATCH /api/settings/:key - Update setting by key
router.patch('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.key;
    delete updates.updated_at;

    // Define allowed fields based on schema.sql
    const ALLOWED = ['value'];

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
      `UPDATE settings SET ${setClause} WHERE \`key\` = ?`,
      [...fields.map(field => updates[field]), key]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const [updatedSetting] = await pool.query('SELECT * FROM settings WHERE \`key\` = ?', [key]);
    res.json(updatedSetting[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/settings/:key - Delete setting by key
router.delete('/:key', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM settings WHERE \`key\` = ?', [req.params.key]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;