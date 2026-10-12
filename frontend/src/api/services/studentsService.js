import { api } from '../client.js';

/**
 * @typedef {import('../../types/students.js').Student} Student
 */

// ---------- Mappers ----------
// The API speaks snake_case (year_level, enrolled_date, activity_date, activity_text).
// The rest of the React app speaks camelCase. Normalize at the boundary so no
// component has to know which side of the wire it's reading from.

function fromApi(raw) {
  if (!raw) return raw;
  return {
    ...raw,
    userId: raw.user_id,
    yearLevel: raw.year_level,
    enrolledDate: raw.enrolled_date,
    requirements: (raw.requirements || []).map((r) => ({
      ...r,
      // `id` stays as the junction-row id (SR-…) for React keys.
      // `requirementId` is the catalog id (REQ-…) used by the status endpoint.
      requirementId: r.requirement_id,
    })),
    activity: (raw.activity || []).map((a) => ({
      ...a,
      date: a.activity_date,
      text: a.activity_text,
    })),
  };
}

function toApi(data) {
  const out = { ...data };
  if ('yearLevel' in out)    { out.year_level    = out.yearLevel;    delete out.yearLevel; }
  if ('enrolledDate' in out) { out.enrolled_date = out.enrolledDate; delete out.enrolledDate; }
  if ('userId' in out)       { out.user_id       = out.userId;       delete out.userId; }
  return out;
}

// ---------- CRUD ----------

/**
 * Get all students
 * @returns {Promise<Student[]>}
 */
export const listStudents = async () => {
  const rows = await api.get('/students');
  return rows.map(fromApi);
};

/**
 * Get student by ID
 * @param {string} id
 * @returns {Promise<Student>}
 */
export const getStudent = async (id) => {
  return fromApi(await api.get(`/students/${id}`));
};

/**
 * Create a new student
 * @param {Object} data - { name, email, contact, yearLevel, section, status, enrolledDate? }
 * @returns {Promise<Student>}
 */
export const createStudent = async (data) => {
  return fromApi(await api.post('/students', toApi(data)));
};

/**
 * Update student by ID
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Student>}
 */
export const updateStudent = async (id, data) => {
  return fromApi(await api.patch(`/students/${id}`, toApi(data)));
};

/**
 * Delete student by ID
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteStudent = async (id) => {
  return api.delete(`/students/${id}`);
};

/**
 * Link a student record to a Student-role user account.
 * Updates both `students.user_id` and `users.student_id` on the backend.
 * @param {string} studentId
 * @param {string} userId
 * @returns {Promise<Student>}
 */
export const linkStudentToUser = async (studentId, userId) => {
  return fromApi(await api.post(`/students/${studentId}/link-user`, { userId }));
};

/**
 * Remove the link between a student record and its user account.
 * @param {string} studentId
 * @returns {Promise<Student>}
 */
export const unlinkStudentUser = async (studentId) => {
  return fromApi(await api.post(`/students/${studentId}/unlink-user`));
};