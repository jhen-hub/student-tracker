import { Router } from 'express';
import { pool } from '../../db.js';
import { broadcastUpdate } from '../socket.js';

const router = Router();
// ---------- Helpers ----------
async function nextStudentId(conn) {
  const [[{ maxId }]] = await conn.query(
    "SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS maxId FROM students WHERE id LIKE 'STU-%'"
  );
  const next = maxId ? parseInt(maxId) + 1 : 1;
  return `STU-${next.toString().padStart(3, '0')}`;
}

// Fetch a single student with its requirements and activity embedded
async function loadStudent(id) {
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const student = rows[0];

  const [requirements] = await pool.query(
    `SELECT sr.*, rc.name AS name, rc.description, rc.active AS active
       FROM student_requirements sr
       JOIN requirements_catalog rc ON sr.requirement_id = rc.id
      WHERE sr.student_id = ?`,
    [student.id]
  );

  const [activity] = await pool.query(
    'SELECT * FROM student_activity WHERE student_id = ? ORDER BY activity_date DESC',
    [student.id]
  );

  return { ...student, requirements, activity };
}

// ---------- Routes ----------

// GET /api/students - Optimized: 3 queries total, regardless of student count
router.get('/', async (req, res, next) => {
  try {
    const [students] = await pool.query('SELECT * FROM students');
    if (students.length === 0) return res.json([]);

    const studentIds = students.map(s => s.id);
    const placeholders = studentIds.map(() => '?').join(',');

    // Get all requirements for these students in ONE query
    const [allRequirements] = await pool.query(
      `SELECT sr.*, rc.name AS name, rc.description, rc.active AS active
         FROM student_requirements sr
         JOIN requirements_catalog rc ON sr.requirement_id = rc.id
        WHERE sr.student_id IN (${placeholders})`,
      studentIds
    );

    // Get all activity for these students in ONE query
    const [allActivity] = await pool.query(
      `SELECT * FROM student_activity 
        WHERE student_id IN (${placeholders}) 
        ORDER BY activity_date DESC`,
      studentIds
    );

    // Stitch them together in memory
    const full = students.map(student => {
      return {
        ...student,
        requirements: allRequirements.filter(r => r.student_id === student.id),
        activity: allActivity.filter(a => a.student_id === student.id),
      };
    });

    res.json(full);
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res, next) => {
  try {
    const student = await loadStudent(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    next(err);
  }
});

// POST /api/students - Create a new student (with transaction)
router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { name, email, contact, year_level, section, status, user_id } = req.body;

    if (!name || !email || !year_level) {
      return res.status(400).json({ error: 'Missing required fields: name, email, year_level' });
    }

    const enrolled_date = req.body.enrolled_date || new Date().toISOString().slice(0, 10);

    await conn.beginTransaction();

    const id = await nextStudentId(conn);

    await conn.query(
      `INSERT INTO students
         (id, user_id, name, email, contact, year_level, section, status, enrolled_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user_id || null, name, email, contact || null, year_level,
        section || null, status || 'Active', enrolled_date]
    );

    const [activeReqs] = await conn.query('SELECT id FROM requirements_catalog WHERE active = TRUE');
    if (activeReqs.length > 0) {
      const values = activeReqs.map((r) => [
        `SR-${id}-${r.id}`, id, r.id, 'Missing', null,
      ]);
      await conn.query(
        'INSERT INTO student_requirements (id, student_id, requirement_id, status, submitted_at) VALUES ?',
        [values]
      );
    }

    await conn.query(
      'INSERT INTO student_activity (id, student_id, activity_date, activity_text) VALUES (?, ?, ?, ?)',
      [`SA-${id}-0`, id, enrolled_date, `Enrolled for ${year_level}${section ? `, ${section}` : ''}`]
    );

    await conn.commit();

    const created = await loadStudent(id);
    broadcastUpdate();
    res.status(201).json(created);
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A student with that id or email already exists' });
    }
    next(err);
  } finally {
    conn.release();
  }
});

// PATCH /api/students/:id - Update student (with transaction)
router.patch('/:id', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    const ALLOWED = ['name', 'email', 'contact', 'year_level',
      'section', 'status', 'enrolled_date'];

    const unknown = Object.keys(updates).filter((k) => !ALLOWED.includes(k));
    if (unknown.length > 0) {
      return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}` });
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await conn.beginTransaction();

    const setClause = fields.map((f) => `\`${f}\` = ?`).join(', ');
    const [result] = await conn.query(
      `UPDATE students SET ${setClause} WHERE id = ?`,
      [...fields.map((f) => updates[f]), id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Student not found' });
    }

    // Log the edit as an activity entry if core details changed
    if (updates.name || updates.year_level || updates.section) {
      const [[{ count }]] = await conn.query(
        'SELECT COUNT(*) AS count FROM student_activity WHERE student_id = ?',
        [id]
      );
      await conn.query(
        'INSERT INTO student_activity (id, student_id, activity_date, activity_text) VALUES (?, ?, ?, ?)',
        [`SA-${id}-${count}`, id, new Date().toISOString().slice(0, 10), 'Updated student information']
      );
    }

    await conn.commit();

    const updated = await loadStudent(id);
    broadcastUpdate();
    res.json(updated);
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already in use by another student' });
    }
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/students/:id/link-user
router.post('/:id/link-user', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const [[student]] = await conn.query('SELECT id FROM students WHERE id = ?', [id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const [[user]] = await conn.query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'Student') {
      return res.status(400).json({ error: 'Only users with the Student role can be linked' });
    }

    await conn.beginTransaction();

    await conn.query('UPDATE users SET student_id = NULL WHERE student_id = ?', [id]);
    await conn.query('UPDATE students SET user_id = NULL WHERE user_id = ?', [userId]);
    await conn.query('UPDATE students SET user_id = ? WHERE id = ?', [userId, id]);
    await conn.query('UPDATE users SET student_id = ? WHERE id = ?', [id, userId]);

    await conn.commit();

    const updated = await loadStudent(id);
    res.json(updated);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/students/:id/unlink-user
router.post('/:id/unlink-user', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;

    await conn.beginTransaction();
    await conn.query('UPDATE users SET student_id = NULL WHERE student_id = ?', [id]);
    await conn.query('UPDATE students SET user_id = NULL WHERE id = ?', [id]);
    await conn.commit();

    const updated = await loadStudent(id);
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json(updated);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// DELETE /api/students/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query('UPDATE users SET student_id = NULL WHERE student_id = ?', [id]);

    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;