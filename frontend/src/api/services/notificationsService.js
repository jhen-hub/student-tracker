import { api } from '../client.js';

function fromApi(raw) {
  if (!raw) return raw;
  return { ...raw, date: raw.notification_date };
}

function toApi(data) {
  const out = { ...data };
  if ('date' in out) {
    out.notification_date = out.date;
    delete out.date;
  }
  return out;
}

export const listNotifications = async (userId) => {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
  const rows = await api.get(`/notifications${qs}`);
  return rows.map(fromApi);
};

export const getNotification = async (id) => {
  return fromApi(await api.get(`/notifications/${id}`));
};

export const createNotification = async (data) => {
  return fromApi(await api.post('/notifications', toApi(data)));
};

export const updateNotification = async (id, data) => {
  return fromApi(await api.patch(`/notifications/${id}`, toApi(data)));
};

export const deleteNotification = async (id) => {
  return api.delete(`/notifications/${id}`);
};