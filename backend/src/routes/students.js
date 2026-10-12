import { Router } from 'express';
import { pool } from '../../db.js';

const router = Router();
// ---------- Helpers ----------

async function nextStudentId() {
  const [[{ maxId }]] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS maxId FROM students WHERE id LIKE 'STU-%'"
  );
  const next = maxId ? parseInt(maxId) + 1 : 1;
  return `STU-${next.toString().padStart(3, '0')}`;
}

// Fetch a single student with its requirements and activity embedded, in the
// shape the frontend expects (joined name/description on requirements).
async function loadStudent(id) {
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const student = rows[0];

  const [requirements] = await pool.query(
    `SELECT sr.*, rc.name AS name, rc.description
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

// GET /api/students - List all students with requirements + activity
router.get('/', async (req, res, next) => {
  try {
    const [students] = await pool.query('SELECT * FROM students');
    const full = await Promise.all(students.map((s) => loadStudent(s.id)));
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

// POST /api/students - Create a new student (auto-generates id, seeds
// student_requirements from active catalog rows, and logs the enrollment).
router.post('/', async (req, res, next) => {
  try {
    const { name, email, contact, year_level, section, status, user_id } = req.body;

    if (!name || !email || !year_level) {
      return res.status(400).json({ error: 'Missing required fields: name, email, year_level' });
    }

    // Default enrollment date to today — the schema column is NOT NULL with no
    // DEFAULT, and the frontend form doesn't collect it.
    const enrolled_date = req.body.enrolled_date || new Date().toISOString().slice(0, 10);

    const id = await nextStudentId();

    await pool.query(
      `INSERT INTO students
         (id, user_id, name, email, contact, year_level, section, status, enrolled_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user_id || null, name, email, contact || null, year_level,
        section || null, status || 'Active', enrolled_date]
    );

    // Seed a student_requirements row for every ACTIVE catalog requirement,
    // defaulting to 'Missing'. Matches the pattern used in schema.sql's seed.
    const [activeReqs] = await pool.query(
      'SELECT id FROM requirements_catalog WHERE active = TRUE'
    );
    if (activeReqs.length > 0) {
      const values = activeReqs.map((r) => [
        `SR-${id}-${r.id}`,  // ≤ 50 chars for VARCHAR(50)
        id,
        r.id,
        'Missing',
        null,
      ]);
      await pool.query(
        'INSERT INTO student_requirements (id, student_id, requirement_id, status, submitted_at) VALUES ?',
        [values]
      );
    }

    // Enrollment activity log entry
    await pool.query(
      'INSERT INTO student_activity (id, student_id, activity_date, activity_text) VALUES (?, ?, ?, ?)',
      [`SA-${id}-0`, id, enrolled_date,
      `Enrolled for ${year_level}${section ? `, ${section}` : ''}`]
    );

    const created = await loadStudent(id);
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A student with that id or email already exists' });
    }
    next(err);
  }
});

// PATCH /api/students/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    const ALLOWED = [ 'name', 'email', 'contact', 'year_level',
      'section', 'status', 'enrolled_date'];

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
      `UPDATE students SET ${setClause} WHERE id = ?`,
      [...fields.map((f) => updates[f]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Log the edit as an activity entry
    if (updates.name || updates.year_level || updates.section) {
      const [[{ count }]] = await pool.query(
        'SELECT COUNT(*) AS count FROM student_activity WHERE student_id = ?',
        [id]
      );
      await pool.query(
        'INSERT INTO student_activity (id, student_id, activity_date, activity_text) VALUES (?, ?, ?, ?)',
        [`SA-${id}-${count}`, id, new Date().toISOString().slice(0, 10),
          'Updated student information']
      );
    }

    const updated = await loadStudent(id);
    res.json(updated);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already in use by another student' });
    }
    next(err);
  }
});

// POST /api/students/:id/link-user - atomically link a Student-role user
router.post('/:id/link-user', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      conn.release();
      return res.status(400).json({ error: 'userId is required' });
    }

    const [[student]] = await conn.query('SELECT id FROM students WHERE id = ?', [id]);
    if (!student) {
      conn.release();
      return res.status(404).json({ error: 'Student not found' });
    }

    const [[user]] = await conn.query(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );
    if (!user) {
      conn.release();
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role !== 'Student') {
      conn.release();
      return res.status(400).json({
        error: 'Only users with the Student role can be linked to a student record',
      });
    }

    await conn.beginTransaction();

    // Break any pre-existing links on either side, then set the new ones.
    // The order matters: clear `users.student_id` for anyone currently pointing
    // at this student, and clear `students.user_id` for any student currently
    // pointing at this user — then write both new values.
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

    // Break the link from any user account first — `users.student_id` is a
    // plain column, not an FK, so it won't cascade.
    await pool.query('UPDATE users SET student_id = NULL WHERE student_id = ?', [id]);

    // student_requirements and student_activity both have ON DELETE CASCADE,
    // so this single delete cleans up the rest.
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