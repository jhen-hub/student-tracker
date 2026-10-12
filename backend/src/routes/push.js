import { Router } from 'express';
import { pool } from '../../db.js';
import { saveSubscription } from '../services/pushService.js';

const router = Router();
// GET /api/push/vapid-public-key - frontend fetches this before subscribing
router.get('/vapid-public-key', (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(500).json({ error: 'VAPID public key is not configured' });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe - persist a browser subscription for a user
router.post('/subscribe', async (req, res, next) => {
  try {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) {
      return res.status(400).json({ error: 'userId and subscription are required' });
    }
    await saveSubscription(userId, subscription);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/push/unsubscribe - drop a subscription by endpoint
router.delete('/unsubscribe', async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint is required' });
    }
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;