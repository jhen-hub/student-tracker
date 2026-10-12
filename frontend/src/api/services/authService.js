import { api } from '../client.js';

export const loginSession = (email, password) =>
  api.post('/auth/login', { email, password });

export const logoutSession = () =>
  api.post('/auth/logout', {});

export const getMe = () =>
  api.get('/auth/me');