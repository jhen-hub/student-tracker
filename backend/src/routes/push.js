import { Router } from 'express';
import { pool } from '../../db.js';
import { saveSubscription } from '../services/pushService.js';

const router = Router();

router.get('/vapid-public-key', (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(500).json({ error: 'VAPID public key is not configured' });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', async (req, res, next) => {
  try {
    const userId = req.session?.userId || req.body?.userId;
    const { subscription } = req.body;
    const userAgent = req.headers['user-agent'] || null;

    if (!userId || !subscription) {
      return res.status(400).json({ error: 'userId and subscription are required' });
    }

    await saveSubscription(userId, subscription, userAgent);
    console.log(`[push] subscribe: user ${userId} (${userAgent?.slice(0, 60) || 'unknown UA'})`);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/unsubscribe', async (req, res, next) => {
  try {
    const userId = req.session?.userId || req.body?.userId;
    const { endpoint } = req.body;
    if (!userId || !endpoint) {
      return res.status(400).json({ error: 'userId and endpoint are required' });
    }
    const [result] = await pool.query(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    );
    console.log(`[push] unsubscribe: user ${userId}, ${result.affectedRows} row(s) removed`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;