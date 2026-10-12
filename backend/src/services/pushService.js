import webpush from 'web-push';
import { pool } from '../../db.js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@registrar.edu',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function saveSubscription(userId, subscription) {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Invalid subscription payload');
  }

  const id = `PS-${Buffer.from(endpoint).toString('base64url').slice(0, 44)}`;

  await pool.query(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, keys_p256dh, keys_auth)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       keys_p256dh = VALUES(keys_p256dh),
       keys_auth = VALUES(keys_auth)`,
    [id, userId, endpoint, keys.p256dh, keys.auth]
  );
}

export async function sendToUsers(userIds, payload) {
  if (!userIds || userIds.length === 0) {
    console.log('[push] sendToUsers: empty userIds, skipping');
    return;
  }

  const placeholders = userIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id, user_id, endpoint, keys_p256dh, keys_auth
       FROM push_subscriptions
      WHERE user_id IN (${placeholders})`,
    userIds
  );

  console.log(
    `[push] sendToUsers: ${userIds.length} target user(s), ${rows.length} subscription row(s)`
  );

  if (rows.length === 0) return;

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    rows.map((row) =>
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
  results.forEach((res, i) => {
    if (res.status === 'rejected') {
      const code = res.reason?.statusCode;
      console.error(
        `[push] send failed for user ${rows[i].user_id}: status=${code} body=${res.reason?.body || res.reason?.message}`
      );
      if (code === 404 || code === 410) {
        deadIds.push(rows[i].id);
      }
    } else {
      console.log(`[push] send ok for user ${rows[i].user_id}`);
    }
  });

  if (deadIds.length > 0) {
    const deadPlaceholders = deadIds.map(() => '?').join(',');
    await pool.query(
      `DELETE FROM push_subscriptions WHERE id IN (${deadPlaceholders})`,
      deadIds
    );
    console.log(`[push] pruned ${deadIds.length} dead subscription(s)`);
  }
}

export async function sendToRole(role, payload) {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE role = ? AND status = 'Active'",
    [role]
  );
  return sendToUsers(rows.map((r) => r.id), payload);
}