import { api } from '../client.js';

/**
 * @typedef {import('../../types/users.js').User} User
 */

/**
 * Get all users
 * @returns {Promise<User[]>}
 */
export const listUsers = async () => {
  return api.get('/users');
};

/**
 * Get user by ID
 * @param {string} id
 * @returns {Promise<User>}
 */
export const getUser = async (id) => {
  return api.get(`/users/${id}`);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
export const getUserByEmail = async (email) => {
  return api.get(`/users/email/${email}`);
};

/**
 * Create a new user
 * @param {Object} data - Omit id, created_at, updated_at
 * @returns {Promise<User>}
 */
export const createUser = async (data) => {
  return api.post('/users', data);
};

/**
 * Update user by ID
 * @param {string} id
 * @param {Object} data - Fields to update
 * @returns {Promise<User>}
 */
export const updateUser = async (id, data) => {
  return api.patch(`/users/${id}`, data);
};

/**
 * Delete user by ID
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteUser = async (id) => {
  return api.delete(`/users/${id}`);
};

/**
 * Login user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
export const login = async (email, password) => {
  return api.post('/users/login', { email, password });
};

/**
 * Register a new user
 * @param {Object} data - Contains name, email, password, role, etc.
 * @returns {Promise<User>}
 */
export const register = async (data) => {
  return api.post('/users/register', data);
};

/**
 * Change password (verifies current password on the server)
 * @param {string} id
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const changePassword = async (id, currentPassword, newPassword) => {
  return api.patch(`/users/${id}/password`, { currentPassword, newPassword });
};