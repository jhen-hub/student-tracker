import { api } from '../client.js';

/**
 * @typedef {import('../../types/studentRequirements.js').StudentRequirement} StudentRequirement
 */

/**
 * Get all student requirements
 * @returns {Promise<StudentRequirement[]>}
 */
export const listStudentRequirements = async () => {
  return api.get('/student-requirements');
};

/**
 * Get student requirement by ID
 * @param {string} id
 * @returns {Promise<StudentRequirement>}
 */
export const getStudentRequirement = async (id) => {
  return api.get(`/student-requirements/${id}`);
};

/**
 * Create a new student requirement
 * @param {Object} data - Omit id, created_at, updated_at
 * @returns {Promise<StudentRequirement>}
 */
export const createStudentRequirement = async (data) => {
  return api.post('/student-requirements', data);
};

/**
 * Update student requirement by ID
 * @param {string} id
 * @param {Object} data - Fields to update
 * @returns {Promise<StudentRequirement>}
 */
export const updateStudentRequirement = async (id, data) => {
  return api.patch(`/student-requirements/${id}`, data);
};

/**
 * Delete student requirement by ID
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteStudentRequirement = async (id) => {
  return api.delete(`/student-requirements/${id}`);
};

/**
 * Update student requirement status using natural key
 * @param {string} studentId
 * @param {string} requirementId
 * @param {'Submitted' | 'Pending' | 'Missing'} status
 * @returns {Promise<StudentRequirement>}
 */
export const updateStudentRequirementStatus = async (studentId, requirementId, status) => {
  return api.patch(`/student-requirements/${studentId}/${requirementId}/status`, { status });
};