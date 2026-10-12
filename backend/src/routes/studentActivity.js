import { Router } from 'express';
import { pool } from '../../db.js';

const router = Router();
// ---------- Helpers ----------

// Activity IDs are `SA-<studentId>-<n>`, where n is the next free integer for
// that student. Matches the pattern used by POST/PATCH /students.
async function nextActivityId(studentId) {
  const [[{ maxN }]] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id, LENGTH(?) + 4) AS UNSIGNED)) AS maxN " +
    "FROM student_activity WHERE id LIKE CONCAT(?, '-%')",
    [studentId, `SA-${studentId}`]
  );
  const next = maxN ? parseInt(maxN) + 1 : 0;
  return `SA-${studentId}-${next}`;
}

// ---------- Routes ----------

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM student_activity ORDER BY activity_date DESC, created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM student_activity WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student activity not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { student_id, activity_text } = req.body;

    if (!student_id || !activity_text) {
      return res.status(400).json({
        error: 'Missing required fields: student_id, activity_text',
      });
    }

    const activity_date =
      req.body.activity_date || new Date().toISOString().slice(0, 10);

    const id = await nextActivityId(student_id);

    await pool.query(
      'INSERT INTO student_activity (id, student_id, activity_date, activity_text) VALUES (?, ?, ?, ?)',
      [id, student_id, activity_date, activity_text]
    );

    const [row] = await pool.query(
      'SELECT * FROM student_activity WHERE id = ?',
      [id]
    );
    res.status(201).json(row[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    delete updates.id;
    delete updates.created_at;

    const ALLOWED = ['student_id', 'activity_date', 'activity_text'];

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
      `UPDATE student_activity SET ${setClause} WHERE id = ?`,
      [...fields.map((f) => updates[f]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student activity not found' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM student_activity WHERE id = ?',
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
      'DELETE FROM student_activity WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student activity not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;