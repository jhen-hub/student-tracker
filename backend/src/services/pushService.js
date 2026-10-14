import webpush from 'web-push';
import { pool } from '../../db.js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@registrar.edu',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function saveSubscription(userId, subscription, userAgent) {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Invalid subscription payload');
  }

  // Deterministic id per (user, endpoint) so the same user re-subscribing
  // updates their existing row rather than creating a duplicate. Different
  // users on the same browser get separate rows.
  const id = `PS-${Buffer.from(`${userId}:${endpoint}`).toString('base64url').slice(0, 44)}`;

  await pool.query(
    `INSERT INTO push_subscriptions
       (id, user_id, endpoint, keys_p256dh, keys_auth, user_agent, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       keys_p256dh  = VALUES(keys_p256dh),
       keys_auth    = VALUES(keys_auth),
       user_agent   = VALUES(user_agent),
       last_seen_at = NOW()`,
    [id, userId, endpoint, keys.p256dh, keys.auth, userAgent || null]
  );
}

export async function sendToUsers(userIds, payload) {
  if (!userIds || userIds.length === 0) {
    return;
  }

  const placeholders = userIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id, user_id, endpoint, keys_p256dh, keys_auth
       FROM push_subscriptions
      WHERE user_id IN (${placeholders})`,
    userIds
  );

  // Multiple users can share one browser endpoint. Deduplicate so that
  // browser receives one push, not one per matching user.
  const byEndpoint = new Map();
  for (const row of rows) {
    if (!byEndpoint.has(row.endpoint)) byEndpoint.set(row.endpoint, row);
  }
  const targets = [...byEndpoint.values()];

  if (targets.length === 0) return;

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    targets.map((row) =>
      webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.keys_p256dh, auth: row.keys_auth },
        },
        body
      )
    )
  );

  const deadIds = [];
  const sentIds = [];

  results.forEach((res, i) => {
    if (res.status === 'rejected') {
      const code = res.reason?.statusCode;
      console.error(
        `[push] send failed for user ${targets[i].user_id}: status=${code} body=${res.reason?.body || res.reason?.message}`
      );
      if (code === 404 || code === 410) {
        deadIds.push(targets[i].id);
      }
    } else {
      sentIds.push(targets[i].id);
    }
  });

  if (sentIds.length > 0) {
    const sentPlaceholders = sentIds.map(() => '?').join(',');
    await pool.query(
      `UPDATE push_subscriptions SET last_seen_at = NOW() WHERE id IN (${sentPlaceholders})`,
      sentIds
    );
  }

  if (deadIds.length > 0) {
    const deadPlaceholders = deadIds.map(() => '?').join(',');
    await pool.query(
      `DELETE FROM push_subscriptions WHERE id IN (${deadPlaceholders})`,
      deadIds
    );
  }
}

export async function sendToRole(role, payload) {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE role = ? AND status = 'Active'",
    [role]
  );
  return sendToUsers(rows.map((r) => r.id), payload);
}