import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../../db.js';

const router = Router();

const stripPassword = (user) => {
  const { password, ...rest } = user;
  return rest;
};

// POST /api/auth/login - validate credentials, open a session
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    
    // Compare the plaintext password with the hash in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    req.session.userId = user.id;
    res.json(stripPassword(user));
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout - destroy the session
router.post('/logout', (req, res, next) => {
  if (!req.session) return res.status(204).send();
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('registrar.sid');
    res.status(204).send();
  });
});

// GET /api/auth/me - return the currently logged-in user, or 401
router.get('/me', async (req, res, next) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (rows.length === 0) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'Session user no longer exists' });
    }

    const user = rows[0];
    if (user.status !== 'Active') {
      req.session.destroy(() => {});
      return res.status(403).json({ error: 'Account is inactive' });
    }

    res.json(stripPassword(user));
  } catch (err) {
    next(err);
  }
});

export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

export default router;