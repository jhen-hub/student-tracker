import { Router } from 'express';
import { pool } from '../../db.js';

const router = Router();
// ---------- Helpers ----------

// ID format is `SR-<studentId>-<requirementId>`. Deterministic — the
// unique_student_req constraint guarantees at most one row per pair, so the
// ID is naturally unique. No MAX/CAST scan needed.
function makeStudentRequirementId(studentId, requirementId) {
  return `SR-${studentId}-${requirementId}`;
}

// ---------- Routes ----------

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM student_requirements');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM student_requirements WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student requirement not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/student-requirements
router.post('/', async (req, res, next) => {
  try {
    const { student_id, requirement_id, status, submitted_at } = req.body;

    if (!student_id || !requirement_id) {
      return res.status(400).json({
        error: 'Missing required fields: student_id and requirement_id',
      });
    }

    const validStatuses = ['Submitted', 'Pending', 'Missing'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const id = makeStudentRequirementId(student_id, requirement_id);

    await pool.query(
      'INSERT INTO student_requirements (id, student_id, requirement_id, status, submitted_at) VALUES (?, ?, ?, ?, ?)',
      [id, student_id, requirement_id, status || 'Missing', submitted_at || null]
    );

    const [row] = await pool.query(
      'SELECT * FROM student_requirements WHERE id = ?',
      [id]
    );
    res.status(201).json(row[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: 'Student requirement already exists for this student and requirement',
      });
    }
    next(err);
  }
});

// PATCH /api/student-requirements/:studentId/:requirementId/status
// MUST be declared before PATCH /:id — though Express's path matching means
// the one-segment /:id route won't match a three-segment path anyway, this
// keeps the intent explicit.
router.patch('/:studentId/:requirementId/status', async (req, res, next) => {
  try {
    const { studentId, requirementId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Submitted', 'Pending', 'Missing'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: Submitted, Pending, Missing',
      });
    }

    const submittedAt = status === 'Submitted' ? new Date() : null;

    const [result] = await pool.query(
      'UPDATE student_requirements SET status = ?, submitted_at = ? WHERE student_id = ? AND requirement_id = ?',
      [status, submittedAt, studentId, requirementId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student requirement not found' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM student_requirements WHERE student_id = ? AND requirement_id = ?',
      [studentId, requirementId]
    );
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/student-requirements/:id - generic update by junction-row id
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    const ALLOWED = ['student_id', 'requirement_id', 'status', 'submitted_at'];

    const unknown = Object.keys(updates).filter((k) => !ALLOWED.includes(k));
    if (unknown.length > 0) {
      return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}` });
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (updates.status) {
      const validStatuses = ['Submitted', 'Pending', 'Missing'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
    }

    const setClause = fields.map((f) => `\`${f}\` = ?`).join(', ');
    const [result] = await pool.query(
      `UPDATE student_requirements SET ${setClause} WHERE id = ?`,
      [...fields.map((f) => updates[f]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student requirement not found' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM student_requirements WHERE id = ?',
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
      'DELETE FROM student_requirements WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student requirement not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;