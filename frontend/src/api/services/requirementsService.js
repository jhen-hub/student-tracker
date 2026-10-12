import { api } from '../client.js';

/**
 * @typedef {import('../../types/requirements.js').Requirement} Requirement
 */

/**
 * Get all requirements
 * @returns {Promise<Requirement[]>}
 */
export const listRequirements = async () => {
  return api.get('/requirements');
};

/**
 * Get requirement by ID
 * @param {string} id
 * @returns {Promise<Requirement>}
 */
export const getRequirement = async (id) => {
  return api.get(`/requirements/${id}`);
};

/**
 * Create a new requirement
 * @param {Object} data - Omit id, created_at, updated_at
 * @returns {Promise<Requirement>}
 */
export const createRequirement = async (data) => {
  return api.post('/requirements', data);
};

/**
 * Update requirement by ID
 * @param {string} id
 * @param {Object} data - Fields to update
 * @returns {Promise<Requirement>}
 */
export const updateRequirement = async (id, data) => {
  return api.patch(`/requirements/${id}`, data);
};

/**
 * Delete requirement by ID
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteRequirement = async (id) => {
  return api.delete(`/requirements/${id}`);
};