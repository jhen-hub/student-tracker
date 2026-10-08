import express from 'express';
const router = express.Router();
import { pool } from '../../db.js';

// GET /api/requirements - List all requirements
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requirements_catalog');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/requirements/:id - Get requirement by ID
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requirements_catalog WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/requirements - Create a new requirement
router.post('/', async (req, res, next) => {
  try {
    const { name, description, active } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    const [result] = await pool.query(
      'INSERT INTO requirements_catalog (name, description, active) VALUES (?, ?, ?)',
      [name, description || null, active !== undefined ? active : true]
    );

    const [newRequirement] = await pool.query('SELECT * FROM requirements_catalog WHERE id = ?', [result.insertId]);
    res.status(201).json(newRequirement[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/requirements/:id - Update requirement by ID
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;

    // Define allowed fields based on schema.sql
    const ALLOWED = ['name', 'description', 'active'];

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
      `UPDATE requirements_catalog SET ${setClause} WHERE id = ?`,
      [...fields.map(field => updates[field]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    const [updatedRequirement] = await pool.query('SELECT * FROM requirements_catalog WHERE id = ?', [id]);
    res.json(updatedRequirement[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/requirements/:id - Delete requirement by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM requirements_catalog WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;