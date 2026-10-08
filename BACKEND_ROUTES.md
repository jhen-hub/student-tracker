# Backend API Routes for Vertudez

## Users
- `GET /api/users` - List all users
  - Response: `[User]`
  - Frontend: `listUsers()`
- `GET /api/users/:id` - Get user by ID
  - Response: `User`
  - Frontend: `getUser(id)`
- `GET /api/users/email/:email` - Get user by email
  - Response: `User`
  - Frontend: `getUserByEmail(email)`
- `POST /api/users` - Create a new user
  - Request: `{ name, email, password, role, status?, student_id? }`
  - Response: `User`
  - Frontend: `createUser(data)`
- `PATCH /api/users/:id` - Update user by ID
  - Request: `{ name?, email?, password?, role?, status?, student_id? }`
  - Response: `User`
  - Frontend: `updateUser(id, data)`
- `DELETE /api/users/:id` - Delete user by ID
  - Response: `204 No Content`
  - Frontend: `deleteUser(id)`

## Students
- `GET /api/students` - List all students
  - Response: `[Student]`
  - Frontend: `listStudents()`
- `GET /api/students/:id` - Get student by ID
  - Response: `Student`
  - Frontend: `getStudent(id)`
- `POST /api/students` - Create a new student
  - Request: `{ name, email, contact?, year_level, section?, status?, enrolled_date, user_id? }`
  - Response: `Student`
  - Frontend: `createStudent(data)`
- `PATCH /api/students/:id` - Update student by ID
  - Request: `{ name?, email?, contact?, year_level?, section?, status?, enrolled_date?, user_id? }`
  - Response: `Student`
  - Frontend: `updateStudent(id, data)`
- `DELETE /api/students/:id` - Delete student by ID
  - Response: `204 No Content`
  - Frontend: `deleteStudent(id)`

## Requirements (requirements_catalog)
- `GET /api/requirements` - List all requirements
  - Response: `[Requirement]`
  - Frontend: `listRequirements()`
- `GET /api/requirements/:id` - Get requirement by ID
  - Response: `Requirement`
  - Frontend: `getRequirement(id)`
- `POST /api/requirements` - Create a new requirement
  - Request: `{ name, description?, active? }`
  - Response: `Requirement`
  - Frontend: `createRequirement(data)`
- `PATCH /api/requirements/:id` - Update requirement by ID
  - Request: `{ name?, description?, active? }`
  - Response: `Requirement`
  - Frontend: `updateRequirement(id, data)`
- `DELETE /api/requirements/:id` - Delete requirement by ID
  - Response: `204 No Content`
  - Frontend: `deleteRequirement(id)`

## Student Requirements
- `GET /api/student-requirements` - List all student requirements
  - Response: `[StudentRequirement]`
  - Frontend: `listStudentRequirements()`
- `GET /api/student-requirements/:id` - Get student requirement by ID
  - Response: `StudentRequirement`
  - Frontend: `getStudentRequirement(id)`
- `POST /api/student-requirements` - Create a new student requirement
  - Request: `{ student_id, requirement_id, status?, submitted_at? }`
  - Response: `StudentRequirement`
  - Frontend: `createStudentRequirement(data)`
- `PATCH /api/student-requirements/:id` - Update student requirement by ID
  - Request: `{ student_id?, requirement_id?, status?, submitted_at? }`
  - Response: `StudentRequirement`
  - Frontend: `updateStudentRequirement(id, data)`
- `DELETE /api/student-requirements/:id` - Delete student requirement by ID
  - Response: `204 No Content`
  - Frontend: `deleteStudentRequirement(id)`
- `PATCH /api/student-requirements/:studentId/:requirementId/status` - Update status using natural key
  - Request: `{ status: "Submitted" | "Pending" | "Missing" }`
  - Response: `StudentRequirement`
  - Frontend: *(Special endpoint not directly mapped in frontend service)*
  - **Why natural key**: Uses composite `(student_id, requirement_id)` which has a UNIQUE index. Single atomic UPDATE prevents TOCTOU vulnerabilities and is more efficient than lookup-then-update.

## Student Activity
- `GET /api/student-activity` - List all student activities
  - Response: `[StudentActivity]`
  - Frontend: `listStudentActivities()`
- `GET /api/student-activity/:id` - Get student activity by ID
  - Response: `StudentActivity`
  - Frontend: `getStudentActivity(id)`
- `POST /api/student-activity` - Create a new student activity
  - Request: `{ student_id, activity_date, activity_text }`
  - Response: `StudentActivity`
  - Frontend: `createStudentActivity(data)`
- `PATCH /api/student-activity/:id` - Update student activity by ID
  - Request: `{ student_id?, activity_date?, activity_text? }`
  - Response: `StudentActivity`
  - Frontend: `updateStudentActivity(id, data)`
- `DELETE /api/student-activity/:id` - Delete student activity by ID
  - Response: `204 No Content`
  - Frontend: `deleteStudentActivity(id)`

## Notifications
- `GET /api/notifications` - List all notifications
  - Response: `[Notification]`
  - Frontend: `listNotifications()`
- `GET /api/notifications/:id` - Get notification by ID
  - Response: `Notification`
  - Frontend: `getNotification(id)`
- `POST /api/notifications` - Create a new notification
  - Request: `{ title, message?, notification_date, read? }`
  - Response: `Notification`
  - Frontend: `createNotification(data)`
- `PATCH /api/notifications/:id` - Update notification by ID
  - Request: `{ title?, message?, notification_date?, read? }`
  - Response: `Notification`
  - Frontend: `updateNotification(id, data)`
- `DELETE /api/notifications/:id` - Delete notification by ID
  - Response: `204 No Content`
  - Frontend: `deleteNotification(id)`

## Settings
- `GET /api/settings` - List all settings
  - Response: `[Setting]`
  - Frontend: `listSettings()`
- `GET /api/settings/:key` - Get setting by key
  - Response: `Setting`
  - Frontend: `getSetting(key)`
- `POST /api/settings` - Create a new setting
  - Request: `{ key, value }`
  - Response: `Setting`
  - Frontend: `createSetting(data)`
- `PATCH /api/settings/:key` - Update setting by key
  - Request: `{ value? }`
  - Response: `Setting`
  - Frontend: `updateSetting(key, data)`
- `DELETE /api/settings/:key` - Delete setting by key
  - Response: `204 No Content`
  - Frontend: `deleteSetting(key)`

## Data Types
All date fields are returned as ISO strings (YYYY-MM-DD HH:MM:SS or YYYY-MM-DD) matching the database format.

## Error Handling
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error