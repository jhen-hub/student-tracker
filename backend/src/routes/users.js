import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../../db.js';
import { broadcastUpdate } from '../socket.js';

const router = Router();
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

// GET /api/users/email/:email
router.get('/email/:email', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [req.params.email]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(stripPassword(rows[0]));
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(stripPassword(rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/users/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, student_id } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

    const allowedRoles = ['Staff', 'Student'];
    const chosenRole = allowedRoles.includes(role) ? role : 'Student';

    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) return res.status(400).json({ error: 'Email already exists' });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const [[{ maxId }]] = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS maxId FROM users WHERE id LIKE 'USR-%'"
    );
    const nextId = maxId ? parseInt(maxId) + 1 : 1;
    const id = `USR-${nextId.toString().padStart(3, '0')}`;

    // Staff require Admin approval (Inactive), Students are auto-approved (Active)
    const initialStatus = chosenRole === 'Staff' ? 'Inactive' : 'Active';

    await pool.query(
      'INSERT INTO users (id, name, email, password, role, status, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, chosenRole, initialStatus, student_id || null]
    );

    // If it's a Staff account, notify the Admin
    if (chosenRole === 'Staff') {
      // 1. Generate Notification ID
      const [[{ nMaxId }]] = await pool.query(
        "SELECT MAX(CAST(SUBSTRING(id, 7) AS UNSIGNED)) AS nMaxId FROM notifications WHERE id LIKE 'NOTIF-%'"
      );
      const nNextId = nMaxId ? parseInt(nMaxId) + 1 : 1;
      const notifId = `NOTIF-${nNextId.toString().padStart(3, '0')}`;
      
      // 2. Insert Notification
      await pool.query(
        'INSERT INTO notifications (id, recipient_type, recipient_value, title, message, notification_date) VALUES (?, ?, ?, ?, ?, ?)',
        [
          notifId, 
          'Role', 
          'Admin', 
          'New Staff Registration', 
          `${name} (${email}) has registered as Staff and requires your approval.`, 
          new Date().toISOString().slice(0, 10)
        ]
      );

      // 3. Live update
      broadcastUpdate();
    }

    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.status(201).json(stripPassword(newUser[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
    next(err);
  }
});

// PATCH /api/users/:id/password - Change password
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
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id - Update user details
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    delete updates.id;
    delete updates.created_at;
    delete updates.currentPassword;
    delete updates.newPassword;

    // If an admin is updating the password directly via this route, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const ALLOWED = ['name', 'email', 'password', 'role', 'status', 'student_id'];
    const unknown = Object.keys(updates).filter(k => !ALLOWED.includes(k));
    if (unknown.length > 0) {
      return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}` });
    }

    const fields = Object.keys(updates);
    if (fields.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    const setClause = fields.map(f => `\`${f}\` = ?`).join(', ');
    const [result] = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...fields.map(field => updates[field]), id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });

    const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.json(stripPassword(updatedUser[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
    next(err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/users/login (Legacy route, not using sessions, but still needs bcrypt)
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    res.json(stripPassword(user));
  } catch (err) {
    next(err);
  }
});

// POST /api/users/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, student_id } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

    const allowedRoles = ['Staff', 'Student'];
    const chosenRole = allowedRoles.includes(role) ? role : 'Student';

    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) return res.status(400).json({ error: 'Email already exists' });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const [[{ maxId }]] = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS maxId FROM users WHERE id LIKE 'USR-%'"
    );
    const nextId = maxId ? parseInt(maxId) + 1 : 1;
    const id = `USR-${nextId.toString().padStart(3, '0')}`;

    await pool.query(
      'INSERT INTO users (id, name, email, password, role, status, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, chosenRole, 'Active', student_id || null]
    );

    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.status(201).json(stripPassword(newUser[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
    next(err);
  }
});

export default router;