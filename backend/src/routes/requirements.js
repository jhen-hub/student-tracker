import { Router } from 'express';
import { pool } from '../../db.js';
import { sendToRole } from '../services/pushService.js';

const router = Router();
// ---------- Helpers ----------

async function nextRequirementId() {
  const [[{ maxId }]] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS maxId FROM requirements_catalog WHERE id LIKE 'REQ-%'"
  );
  const next = maxId ? parseInt(maxId) + 1 : 1;
  return `REQ-${next.toString().padStart(3, '0')}`;
}

// ---------- Routes ----------

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requirements_catalog');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM requirements_catalog WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { name, description, active } = req.body;

    if (!name) {
      conn.release();
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    const isActive = active !== undefined ? !!active : true;

    await conn.beginTransaction();

    const id = await nextRequirementId();

    await conn.query(
      'INSERT INTO requirements_catalog (id, name, description, active) VALUES (?, ?, ?, ?)',
      [id, name, description || null, isActive]
    );

    // Back-fill a 'Missing' row for every active student so the new
    // requirement immediately appears on their checklist.
    if (isActive) {
      const [students] = await conn.query(
        "SELECT id FROM students WHERE status = 'Active'"
      );
      if (students.length > 0) {
        const values = students.map((s) => [`SR-${s.id}-${id}`, s.id, id, 'Missing', null]);
        await conn.query(
          'INSERT INTO student_requirements (id, student_id, requirement_id, status, submitted_at) VALUES ?',
          [values]
        );
      }
    }

    await conn.commit();

    const [newRequirement] = await conn.query(
      'SELECT * FROM requirements_catalog WHERE id = ?',
      [id]
    );

    // Fire-and-forget push — don't block the HTTP response on the push service.
    if (isActive) {
      const payload = {
        title: 'New requirement activated',
        body: `"${name}" was added and applies to all active students.`,
        url: '/requirements',
        tag: 'requirement-created',
      };
      sendToRole('Admin', payload).catch((err) =>
        console.error('Push to Admins failed:', err)
      );
      sendToRole('Staff', payload).catch((err) =>
        console.error('Push to Staff failed:', err)
      );
    }

    res.status(201).json(newRequirement[0]);
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A requirement with that id already exists' });
    }
    next(err);
  } finally {
    conn.release();
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    const ALLOWED = ['name', 'description', 'active'];

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
      `UPDATE requirements_catalog SET ${setClause} WHERE id = ?`,
      [...fields.map((f) => updates[f]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM requirements_catalog WHERE id = ?',
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
      'DELETE FROM requirements_catalog WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;