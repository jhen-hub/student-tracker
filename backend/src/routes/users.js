import express from 'express';
const router = express.Router();
import { pool } from '../../db.js';

// Helper function to strip password from user object
const stripPassword = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// GET /api/users - List all users
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    // Strip password from all user objects
    const usersWithoutPassword = rows.map(stripPassword);
    res.json(usersWithoutPassword);
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
    // Strip password from user object
    const userWithoutPassword = stripPassword(rows[0]);
    res.json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/email/:email - Get user by email
router.get('/email/:email', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [req.params.email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Strip password from user object
    const userWithoutPassword = stripPassword(rows[0]);
    res.json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
});

// POST /api/users - Create a new user
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role, status, student_id } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate ID in format USR-XXX
    const [[{ maxId }]] = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) as maxId FROM users WHERE id LIKE 'USR-%'"
    );
    const nextId = maxId ? parseInt(maxId) + 1 : 1;
    const id = `USR-${nextId.toString().padStart(3, '0')}`;

    const [result] = await pool.query(
      'INSERT INTO users (id, name, email, password, role, status, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, password, role, status || 'Active', student_id || null]
    );

    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    // Strip password from user object
    const userWithoutPassword = stripPassword(newUser[0]);
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(err);
  }
});

// PATCH /api/users/:id - Update user by ID
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;

    // Build SET clause dynamically
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = fields.map((field, index) => `${field} = ?`).join(', ');

    const [result] = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...fields.map(field => updates[field]), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    // Strip password from user object
    const userWithoutPassword = stripPassword(updatedUser[0]);
    res.json(userWithoutPassword);
  } catch (err) {
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

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      // User not found - return generic error to prevent email enumeration
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Check password (plaintext comparison for now - hashing would be a future improvement)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password from response
    const userWithoutPassword = stripPassword(user);
    res.json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/register - Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, student_id } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate ID in format USR-XXX
    const [[{ maxId }]] = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) as maxId FROM users WHERE id LIKE 'USR-%'"
    );
    const nextId = maxId ? parseInt(maxId) + 1 : 1;
    const id = `USR-${nextId.toString().padStart(3, '0')}`;

    // Create user with Student role and Active status as per requirements
    const [result] = await pool.query(
      'INSERT INTO users (id, name, email, password, role, status, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, password, 'Student', 'Active', student_id || null]
    );

    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    // Strip password from response
    const userWithoutPassword = stripPassword(newUser[0]);
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(err);
  }
});

export default router;