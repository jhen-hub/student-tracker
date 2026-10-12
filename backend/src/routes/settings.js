import { Router } from 'express';
import { pool } from '../../db.js';

const router = Router();
// Application-level defaults. Every value is a STRING — that's the contract the
// table itself uses (`value TEXT NOT NULL`), and clients like AppContext's
// deserializeSettings rely on it.
const DEFAULTS = {
  schoolName: 'Vertudez University',
  academicYear: '2026-2027',
  defaultRequirements: '["REQ-001","REQ-002","REQ-003"]',
  notifyMissing: 'true',
  notifyDeadlines: 'true',
  theme: 'light',
};

// ---------- Routes ----------

// GET /api/settings - List all settings, merging in defaults for any missing keys
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings');

    const merged = { ...DEFAULTS };
    for (const row of rows) {
      merged[row.key] = row.value;
    }

    res.json(
      Object.keys(merged).map((key) => ({ key, value: merged[key] }))
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/settings/:key - Get one setting (falls back to default if not stored)
router.get('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM settings WHERE `key` = ?',
      [key]
    );
    if (rows.length > 0) {
      return res.json(rows[0]);
    }
    if (DEFAULTS[key] !== undefined) {
      return res.json({ key, value: DEFAULTS[key] });
    }
    return res.status(404).json({ error: 'Setting not found' });
  } catch (err) {
    next(err);
  }
});

// POST /api/settings - Create a new setting
router.post('/', async (req, res, next) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Missing required fields: key, value' });
    }

    // Coerce non-string values to a string so the contract holds.
    const storedValue =
      typeof value === 'string' ? value : JSON.stringify(value);

    await pool.query(
      'INSERT INTO settings (`key`, `value`) VALUES (?, ?)',
      [key, storedValue]
    );

    const [row] = await pool.query(
      'SELECT * FROM settings WHERE `key` = ?',
      [key]
    );
    res.status(201).json(row[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Setting with this key already exists' });
    }
    next(err);
  }
});

// PATCH /api/settings/:key - Update setting by key (upsert if it's a known default)
router.patch('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const updates = { ...req.body };

    delete updates.key;
    delete updates.updated_at;

    const ALLOWED = ['value'];
    const unknown = Object.keys(updates).filter((k) => !ALLOWED.includes(k));
    if (unknown.length > 0) {
      return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}` });
    }

    if (updates.value === undefined) {
      return res.status(400).json({ error: 'Missing required field: value' });
    }

    const storedValue =
      typeof updates.value === 'string'
        ? updates.value
        : JSON.stringify(updates.value);

    const [result] = await pool.query(
      'UPDATE settings SET `value` = ? WHERE `key` = ?',
      [storedValue, key]
    );

    if (result.affectedRows === 0) {
      // Upsert only for known keys — prevents unbounded junk rows.
      if (DEFAULTS[key] === undefined) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      await pool.query(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?)',
        [key, storedValue]
      );
    }

    const [row] = await pool.query(
      'SELECT * FROM settings WHERE `key` = ?',
      [key]
    );
    res.json(row[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/settings/:key
router.delete('/:key', async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM settings WHERE `key` = ?',
      [req.params.key]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;