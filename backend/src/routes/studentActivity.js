import express from 'express';
const router = express.Router();
import { pool } from '../../db.js';

// GET /api/student-activity - List all student activities
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM student_activity');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/student-activity/:id - Get student activity by ID
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM student_activity WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student activity not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/student-activity - Create a new student activity
router.post('/', async (req, res, next) => {
  try {
    const { student_id, activity_date, activity_text } = req.body;

    // Basic validation
    if (!student_id || !activity_date || !activity_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.query(
      'INSERT INTO student_activity (student_id, activity_date, activity_text) VALUES (?, ?, ?)',
      [student_id, activity_date, activity_text]
    );

    const [newActivity] = await pool.query('SELECT * FROM student_activity WHERE id = ?', [result.insertId]);
    res.status(201).json(newActivity[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/student-activity/:id - Update student activity by ID
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;

    // Define allowed fields based on schema.sql
    const ALLOWED = ['student_id', 'activity_date', 'activity_text'];

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
      `UPDATE student_activity SET ${setClause} WHERE id = ?`,
      [...fields.map(field => updates[field]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student activity not found' });
    }

    const [updatedActivity] = await pool.query('SELECT * FROM student_activity WHERE id = ?', [id]);
    res.json(updatedActivity[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/student-activity/:id - Delete student activity by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM student_activity WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student activity not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;