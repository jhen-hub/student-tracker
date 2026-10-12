import { api } from '../client.js';

/**
 * @typedef {import('../../types/settings.js').Setting} Setting
 */

/**
 * Get all settings
 * @returns {Promise<Setting[]>}
 */
export const listSettings = async () => {
  return api.get('/settings');
};

/**
 * Get setting by key
 * @param {string} key
 * @returns {Promise<Setting>}
 */
export const getSetting = async (key) => {
  return api.get(`/settings/${key}`);
};

/**
 * Create a new setting
 * @param {Object} data - Omit updated_at
 * @returns {Promise<Setting>}
 */
export const createSetting = async (data) => {
  return api.post('/settings', data);
};

/**
 * Update setting by key
 * @param {string} key
 * @param {Object} data - Fields to update
 * @returns {Promise<Setting>}
 */
export const updateSetting = async (key, data) => {
  return api.patch(`/settings/${key}`, data);
};

/**
 * Delete setting by key
 * @param {string} key
 * @returns {Promise<void>}
 */
export const deleteSetting = async (key) => {
  return api.delete(`/settings/${key}`);
};