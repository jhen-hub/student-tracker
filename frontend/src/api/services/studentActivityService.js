import { api } from '../client.js';

/**
 * @typedef {import('../../types/studentActivity.js').StudentActivity} StudentActivity
 */

/**
 * Get all student activities
 * @returns {Promise<StudentActivity[]>}
 */
export const listStudentActivities = async () => {
  return api.get('/student-activity');
};

/**
 * Get student activity by ID
 * @param {string} id
 * @returns {Promise<StudentActivity>}
 */
export const getStudentActivity = async (id) => {
  return api.get(`/student-activity/${id}`);
};

/**
 * Create a new student activity
 * @param {Object} data - Omit id, created_at
 * @returns {Promise<StudentActivity>}
 */
export const createStudentActivity = async (data) => {
  return api.post('/student-activity', data);
};

/**
 * Update student activity by ID
 * @param {string} id
 * @param {Object} data - Fields to update
 * @returns {Promise<StudentActivity>}
 */
export const updateStudentActivity = async (id, data) => {
  return api.patch(`/student-activity/${id}`, data);
};

/**
 * Delete student activity by ID
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteStudentActivity = async (id) => {
  return api.delete(`/student-activity/${id}`);
};