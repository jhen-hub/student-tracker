import express from 'express';
const router = express.Router();
import { pool } from '../../db.js';

// GET /api/students - List all students
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id - Get student by ID
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/students - Create a new student
router.post('/', async (req, res, next) => {
  try {
    const { name, email, contact, year_level, section, status, enrolled_date, user_id } = req.body;

    // Basic validation
    if (!name || !email || !year_level || !enrolled_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.query(
      'INSERT INTO students (name, email, contact, year_level, section, status, enrolled_date, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, contact || null, year_level, section || null, status || 'Active', enrolled_date, user_id || null]
    );

    const [newStudent] = await pool.query('SELECT * FROM students WHERE id = ?', [result.insertId]);
    res.status(201).json(newStudent[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/students/:id - Update student by ID
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;

    // Define allowed fields based on schema.sql
    const ALLOWED = ['user_id', 'name', 'email', 'contact', 'year_level', 'section', 'status', 'enrolled_date'];

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
      `UPDATE students SET ${setClause} WHERE id = ?`,
      [...fields.map(field => updates[field]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [updatedStudent] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    res.json(updatedStudent[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/students/:id - Delete student by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;