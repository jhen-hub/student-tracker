import express from 'express';
const router = express.Router();
import { pool } from '../../db.js';

// GET /api/student-requirements - List all student requirements
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM student_requirements');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/student-requirements/:id - Get student requirement by ID
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM student_requirements WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student requirement not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/student-requirements - Create a new student requirement
router.post('/', async (req, res, next) => {
  try {
    const { student_id, requirement_id, status, submitted_at } = req.body;

    // Basic validation
    if (!student_id || !requirement_id) {
      return res.status(400).json({ error: 'Missing required fields: student_id and requirement_id' });
    }

    // Validate status
    const validStatuses = ['Submitted', 'Pending', 'Missing'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const [result] = await pool.query(
      'INSERT INTO student_requirements (student_id, requirement_id, status, submitted_at) VALUES (?, ?, ?, ?)',
      [student_id, requirement_id, status || 'Missing', submitted_at || null]
    );

    const [newStudentReq] = await pool.query('SELECT * FROM student_requirements WHERE id = ?', [result.insertId]);
    res.status(201).json(newStudentReq[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Student requirement already exists for this student and requirement' });
    }
    next(err);
  }
});

// PATCH /api/student-requirements/:id - Update student requirement by ID
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;

    // Define allowed fields based on schema.sql
    const ALLOWED = ['student_id', 'requirement_id', 'status', 'submitted_at'];

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

    // Validate status if being updated
    if (updates.status) {
      const validStatuses = ['Submitted', 'Pending', 'Missing'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
    }

    // Build SET clause safely using only allowed fields
    const setClause = fields.map(f => `\`${f}\` = ?`).join(', ');

    const [result] = await pool.query(
      `UPDATE student_requirements SET ${setClause} WHERE id = ?`,
      [...fields.map(field => updates[field]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student requirement not found' });
    }

    const [updatedStudentReq] = await pool.query('SELECT * FROM student_requirements WHERE id = ?', [id]);
    res.json(updatedStudentReq[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/student-requirements/:id - Delete student requirement by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM student_requirements WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student requirement not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// PATCH /api/student-requirements/:studentId/:requirementId/status - Update status using natural key
router.patch('/:studentId/:requirementId/status', async (req, res, next) => {
  try {
    const { studentId, requirementId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Submitted', 'Pending', 'Missing'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: Submitted, Pending, Missing'
      });
    }

    // Single atomic UPDATE as per requirements
    const submittedAt = status === 'Submitted' ? new Date() : null;

    const [result] = await pool.query(
      'UPDATE student_requirements SET status = ?, submitted_at = ? WHERE student_id = ? AND requirement_id = ?',
      [status, submittedAt, studentId, requirementId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student requirement not found' });
    }

    const [updatedStudentReq] = await pool.query(
      'SELECT * FROM student_requirements WHERE student_id = ? AND requirement_id = ?',
      [studentId, requirementId]
    );
    res.json(updatedStudentReq[0]);
  } catch (err) {
    next(err);
  }
});

export default router;