import { Router } from 'express';
import { pool } from '../../db.js';

const router = Router();
// Helper function to strip password from user object
const stripPassword = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// GET /api/users - List all users
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows.map(stripPassword));
  } catch (err) {
    next(err);
  }
});

// GET /api/users/email/:email - Get user by email
// (MUST come before GET /:id, otherwise Express treats "email" as :id)
router.get('/email/:email', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [req.params.email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(stripPassword(rows[0]));
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(stripPassword(rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/users - Create a new user
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role, status, student_id } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [[{ maxId }]] = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) as maxId FROM users WHERE id LIKE 'USR-%'"
    );
    const nextId = maxId ? parseInt(maxId) + 1 : 1;
    const id = `USR-${nextId.toString().padStart(3, '0')}`;

    await pool.query(
      'INSERT INTO users (id, name, email, password, role, status, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, password, role, status || 'Active', student_id || null]
    );

    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.status(201).json(stripPassword(newUser[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(err);
  }
});

// PATCH /api/users/:id/password - Change password (validates current password)
// MUST come before PATCH /:id
router.patch('/:id/password', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (rows[0].password !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id - Update user by ID (name, email, role, status, etc.)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Never allow id / created_at to be updated
    delete updates.id;
    delete updates.created_at;

    // Strip out password-change fields so they don't trip the ALLOWED check
    delete updates.currentPassword;
    delete updates.newPassword;

    const ALLOWED = ['name', 'email', 'password', 'role', 'status', 'student_id'];

    const unknown = Object.keys(updates).filter(k => !ALLOWED.includes(k));
    if (unknown.length > 0) {
      return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}` });
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = fields.map(f => `\`${f}\` = ?`).join(', ');

    const [result] = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...fields.map(field => updates[field]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.json(stripPassword(updatedUser[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(err);
  }
});

// DELETE /api/users/:id - Delete user by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/users/login - Login user
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json(stripPassword(user));
  } catch (err) {
    next(err);
  }
});

// POST /api/users/register - Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, student_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Public registration may only create Staff or Student accounts.
    // Admin accounts must be provisioned by an existing admin via POST /.
    const allowedRoles = ['Staff', 'Student'];
    const chosenRole = allowedRoles.includes(role) ? role : 'Student';

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const [[{ maxId }]] = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS maxId FROM users WHERE id LIKE 'USR-%'"
    );
    const nextId = maxId ? parseInt(maxId) + 1 : 1;
    const id = `USR-${nextId.toString().padStart(3, '0')}`;

    await pool.query(
      'INSERT INTO users (id, name, email, password, role, status, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, password, chosenRole, 'Active', student_id || null]
    );

    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.status(201).json(stripPassword(newUser[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(err);
  }
});

export default router;