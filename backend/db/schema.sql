-- Database schema for Vertudez project
-- MySQL syntax

-- Create and select the database
CREATE DATABASE IF NOT EXISTS vertudez
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE vertudez;

-- Users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Staff', 'Student') NOT NULL,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    student_id VARCHAR(50), -- Foreign key to students table (only for students)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50), -- Foreign key to users table (optional, for linked accounts)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact VARCHAR(20),
    year_level ENUM('1st Year', '2nd Year', '3rd Year', '4th Year') NOT NULL,
    section VARCHAR(50),
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    enrolled_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Requirements catalog (list of available requirements)
CREATE TABLE requirements_catalog (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Student requirements (junction table: which requirements each student has and their status)
CREATE TABLE student_requirements (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    requirement_id VARCHAR(50) NOT NULL,
    status ENUM('Submitted', 'Pending', 'Missing') NOT NULL DEFAULT 'Missing',
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (requirement_id) REFERENCES requirements_catalog(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_req (student_id, requirement_id)
);

-- Student activity log
CREATE TABLE student_activity (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    activity_date DATE NOT NULL,
    activity_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY,
    recipient_type ENUM('All', 'Role', 'User') NOT NULL DEFAULT 'All',
    recipient_value VARCHAR(50) NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    notification_date DATE NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push notification subcriptions table
CREATE TABLE push_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    endpoint TEXT NOT NULL,
    keys_p256dh TEXT NOT NULL,
    keys_auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_endpoint (endpoint(255))
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
-- Settings table (key-value store for application settings)
CREATE TABLE settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_student_requirements_student ON student_requirements(student_id);
CREATE INDEX idx_student_requirements_requirement ON student_requirements(requirement_id);
CREATE INDEX idx_student_activity_student ON student_activity(student_id);
CREATE INDEX idx_notifications_date ON notifications(notification_date);

-- Seeded data

-- Requirements catalog
INSERT INTO requirements_catalog (id, name, description, active) VALUES
('REQ-001', 'Birth Certificate', 'PSA-issued original or certified true copy.', true),
('REQ-002', 'Form 137', 'Permanent academic record from the previous school.', true),
('REQ-003', 'Valid ID', 'Any government-issued or school-issued ID.', true),
('REQ-004', 'Report Card', 'Most recent Form 138 or grade report.', true),
('REQ-005', '2x2 ID Picture', 'Recent photo, white background, two copies.', true),
('REQ-006', 'Good Moral Certificate', 'Issued by the previous school within the last 6 months.', true),
('REQ-007', 'Medical Certificate', 'Physical exam clearance from an accredited clinic.', false);

-- Users (inserted BEFORE students to satisfy students.user_id FK)
INSERT INTO users (id, name, email, password, role, status, student_id) VALUES
('USR-001', 'Noel Montecillo', 'admin@registrar.edu', 'admin123', 'Admin', 'Active', NULL),
('USR-002', 'Grace Lim', 'staff@registrar.edu', 'staff123', 'Staff', 'Active', NULL),
('USR-003', 'Juan Dela Cruz', 'student@registrar.edu', 'student123', 'Student', 'Active', 'STU-001'),
('USR-004', 'Ramon Diaz', 'ramon.diaz@registrar.edu', 'staff123', 'Staff', 'Inactive', NULL);

-- Students (inserted AFTER users so user_id FK resolves)
INSERT INTO students (id, user_id, name, email, contact, year_level, section, status, enrolled_date) VALUES
('STU-001', 'USR-003', 'Juan Dela Cruz', 'juan.delacruz@example.com', '0912 345 6789', '1st Year', 'BSIT-1A', 'Active', '2026-06-02'),
('STU-002', NULL, 'Maria Santos', 'maria.santos@example.com', '0917 222 4455', '2nd Year', 'BSIT-2B', 'Active', '2025-06-04'),
('STU-003', NULL, 'Pedro Reyes', 'pedro.reyes@example.com', '0928 556 7712', '1st Year', 'BSIT-1A', 'Active', '2026-06-02'),
('STU-004', NULL, 'Angela Cruz', 'angela.cruz@example.com', '0933 998 1123', '3rd Year', 'BSIT-3A', 'Active', '2024-06-03'),
('STU-005', NULL, 'Mark Villanueva', 'mark.villanueva@example.com', '0945 112 8890', '2nd Year', 'BSIT-2A', 'Inactive', '2025-06-05'),
('STU-006', NULL, 'Kristine Bautista', 'kristine.bautista@example.com', '0956 447 2201', '4th Year', 'BSIT-4A', 'Active', '2023-06-01'),
('STU-007', NULL, 'Ronald Garcia', 'ronald.garcia@example.com', '0917 663 9981', '1st Year', 'BSIT-1B', 'Active', '2026-06-02'),
('STU-008', NULL, 'Jasmine Torres', 'jasmine.torres@example.com', '0928 774 3320', '3rd Year', 'BSIT-3B', 'Active', '2024-06-03'),
('STU-009', NULL, 'Michael Aquino', 'michael.aquino@example.com', '0939 220 5567', '2nd Year', 'BSIT-2B', 'Active', '2025-06-04'),
('STU-010', NULL, 'Bea Fernandez', 'bea.fernandez@example.com', '0917 884 6612', '1st Year', 'BSIT-1B', 'Active', '2026-06-02'),
('STU-011', NULL, 'Carlo Mendoza', 'carlo.mendoza@example.com', '0921 340 7789', '4th Year', 'BSIT-4A', 'Active', '2023-06-01'),
('STU-012', NULL, 'Ella Ramos', 'ella.ramos@example.com', '0932 556 0021', '3rd Year', 'BSIT-3A', 'Inactive', '2024-06-03');

-- Student requirements
INSERT INTO student_requirements (id, student_id, requirement_id, status, submitted_at) VALUES
-- STU-001: Submitted, Pending, Missing, Submitted, Submitted, Missing
('SR-STU-001-REQ-001', 'STU-001', 'REQ-001', 'Submitted', NULL),
('SR-STU-001-REQ-002', 'STU-001', 'REQ-002', 'Pending', NULL),
('SR-STU-001-REQ-003', 'STU-001', 'REQ-003', 'Missing', NULL),
('SR-STU-001-REQ-004', 'STU-001', 'REQ-004', 'Submitted', NULL),
('SR-STU-001-REQ-005', 'STU-001', 'REQ-005', 'Submitted', NULL),
('SR-STU-001-REQ-006', 'STU-001', 'REQ-006', 'Missing', NULL),
-- STU-002: all Submitted
('SR-STU-002-REQ-001', 'STU-002', 'REQ-001', 'Submitted', NULL),
('SR-STU-002-REQ-002', 'STU-002', 'REQ-002', 'Submitted', NULL),
('SR-STU-002-REQ-003', 'STU-002', 'REQ-003', 'Submitted', NULL),
('SR-STU-002-REQ-004', 'STU-002', 'REQ-004', 'Submitted', NULL),
('SR-STU-002-REQ-005', 'STU-002', 'REQ-005', 'Submitted', NULL),
('SR-STU-002-REQ-006', 'STU-002', 'REQ-006', 'Submitted', NULL),
-- STU-003: Missing, Missing, Pending, Missing, Missing, Missing
('SR-STU-003-REQ-001', 'STU-003', 'REQ-001', 'Missing', NULL),
('SR-STU-003-REQ-002', 'STU-003', 'REQ-002', 'Missing', NULL),
('SR-STU-003-REQ-003', 'STU-003', 'REQ-003', 'Pending', NULL),
('SR-STU-003-REQ-004', 'STU-003', 'REQ-004', 'Missing', NULL),
('SR-STU-003-REQ-005', 'STU-003', 'REQ-005', 'Missing', NULL),
('SR-STU-003-REQ-006', 'STU-003', 'REQ-006', 'Missing', NULL),
-- STU-004: Submitted, Submitted, Pending, Submitted, Submitted, Pending
('SR-STU-004-REQ-001', 'STU-004', 'REQ-001', 'Submitted', NULL),
('SR-STU-004-REQ-002', 'STU-004', 'REQ-002', 'Submitted', NULL),
('SR-STU-004-REQ-003', 'STU-004', 'REQ-003', 'Pending', NULL),
('SR-STU-004-REQ-004', 'STU-004', 'REQ-004', 'Submitted', NULL),
('SR-STU-004-REQ-005', 'STU-004', 'REQ-005', 'Submitted', NULL),
('SR-STU-004-REQ-006', 'STU-004', 'REQ-006', 'Pending', NULL),
-- STU-005: Pending, Missing, Missing, Pending, Missing, Missing
('SR-STU-005-REQ-001', 'STU-005', 'REQ-001', 'Pending', NULL),
('SR-STU-005-REQ-002', 'STU-005', 'REQ-002', 'Missing', NULL),
('SR-STU-005-REQ-003', 'STU-005', 'REQ-003', 'Missing', NULL),
('SR-STU-005-REQ-004', 'STU-005', 'REQ-004', 'Pending', NULL),
('SR-STU-005-REQ-005', 'STU-005', 'REQ-005', 'Missing', NULL),
('SR-STU-005-REQ-006', 'STU-005', 'REQ-006', 'Missing', NULL),
-- STU-006: Submitted, Submitted, Submitted, Submitted, Submitted, Pending
('SR-STU-006-REQ-001', 'STU-006', 'REQ-001', 'Submitted', NULL),
('SR-STU-006-REQ-002', 'STU-006', 'REQ-002', 'Submitted', NULL),
('SR-STU-006-REQ-003', 'STU-006', 'REQ-003', 'Submitted', NULL),
('SR-STU-006-REQ-004', 'STU-006', 'REQ-004', 'Submitted', NULL),
('SR-STU-006-REQ-005', 'STU-006', 'REQ-005', 'Submitted', NULL),
('SR-STU-006-REQ-006', 'STU-006', 'REQ-006', 'Pending', NULL),
-- STU-007: Submitted, Missing, Submitted, Missing, Pending, Missing
('SR-STU-007-REQ-001', 'STU-007', 'REQ-001', 'Submitted', NULL),
('SR-STU-007-REQ-002', 'STU-007', 'REQ-002', 'Missing', NULL),
('SR-STU-007-REQ-003', 'STU-007', 'REQ-003', 'Submitted', NULL),
('SR-STU-007-REQ-004', 'STU-007', 'REQ-004', 'Missing', NULL),
('SR-STU-007-REQ-005', 'STU-007', 'REQ-005', 'Pending', NULL),
('SR-STU-007-REQ-006', 'STU-007', 'REQ-006', 'Missing', NULL),
-- STU-008: Submitted, Submitted, Submitted, Pending, Submitted, Submitted
('SR-STU-008-REQ-001', 'STU-008', 'REQ-001', 'Submitted', NULL),
('SR-STU-008-REQ-002', 'STU-008', 'REQ-002', 'Submitted', NULL),
('SR-STU-008-REQ-003', 'STU-008', 'REQ-003', 'Submitted', NULL),
('SR-STU-008-REQ-004', 'STU-008', 'REQ-004', 'Pending', NULL),
('SR-STU-008-REQ-005', 'STU-008', 'REQ-005', 'Submitted', NULL),
('SR-STU-008-REQ-006', 'STU-008', 'REQ-006', 'Submitted', NULL),
-- STU-009: Missing, Pending, Missing, Missing, Missing, Missing
('SR-STU-009-REQ-001', 'STU-009', 'REQ-001', 'Missing', NULL),
('SR-STU-009-REQ-002', 'STU-009', 'REQ-002', 'Pending', NULL),
('SR-STU-009-REQ-003', 'STU-009', 'REQ-003', 'Missing', NULL),
('SR-STU-009-REQ-004', 'STU-009', 'REQ-004', 'Missing', NULL),
('SR-STU-009-REQ-005', 'STU-009', 'REQ-005', 'Missing', NULL),
('SR-STU-009-REQ-006', 'STU-009', 'REQ-006', 'Missing', NULL),
-- STU-010: Submitted, Submitted, Missing, Submitted, Submitted, Missing
('SR-STU-010-REQ-001', 'STU-010', 'REQ-001', 'Submitted', NULL),
('SR-STU-010-REQ-002', 'STU-010', 'REQ-002', 'Submitted', NULL),
('SR-STU-010-REQ-003', 'STU-010', 'REQ-003', 'Missing', NULL),
('SR-STU-010-REQ-004', 'STU-010', 'REQ-004', 'Submitted', NULL),
('SR-STU-010-REQ-005', 'STU-010', 'REQ-005', 'Submitted', NULL),
('SR-STU-010-REQ-006', 'STU-010', 'REQ-006', 'Missing', NULL),
-- STU-011: Submitted, Submitted, Submitted, Submitted, Pending, Submitted
('SR-STU-011-REQ-001', 'STU-011', 'REQ-001', 'Submitted', NULL),
('SR-STU-011-REQ-002', 'STU-011', 'REQ-002', 'Submitted', NULL),
('SR-STU-011-REQ-003', 'STU-011', 'REQ-003', 'Submitted', NULL),
('SR-STU-011-REQ-004', 'STU-011', 'REQ-004', 'Submitted', NULL),
('SR-STU-011-REQ-005', 'STU-011', 'REQ-005', 'Pending', NULL),
('SR-STU-011-REQ-006', 'STU-011', 'REQ-006', 'Submitted', NULL),
-- STU-012: all Missing
('SR-STU-012-REQ-001', 'STU-012', 'REQ-001', 'Missing', NULL),
('SR-STU-012-REQ-002', 'STU-012', 'REQ-002', 'Missing', NULL),
('SR-STU-012-REQ-003', 'STU-012', 'REQ-003', 'Missing', NULL),
('SR-STU-012-REQ-004', 'STU-012', 'REQ-004', 'Missing', NULL),
('SR-STU-012-REQ-005', 'STU-012', 'REQ-005', 'Missing', NULL),
('SR-STU-012-REQ-006', 'STU-012', 'REQ-006', 'Missing', NULL);

-- Student activity
INSERT INTO student_activity (id, student_id, activity_date, activity_text) VALUES
-- STU-001
('SA-STU-001-0', 'STU-001', '2026-06-02', 'Enrolled for 1st Year, BSIT-1A'),
('SA-STU-001-1', 'STU-001', '2026-06-10', 'Submitted Birth Certificate'),
-- STU-002
('SA-STU-002-0', 'STU-002', '2025-06-04', 'Enrolled for 2nd Year, BSIT-2B'),
('SA-STU-002-1', 'STU-002', '2025-06-20', 'Completed all requirements'),
-- STU-003
('SA-STU-003-0', 'STU-003', '2026-06-02', 'Enrolled for 1st Year, BSIT-1A'),
-- STU-004
('SA-STU-004-0', 'STU-004', '2024-06-03', 'Enrolled for 3rd Year, BSIT-3A'),
('SA-STU-004-1', 'STU-004', '2026-08-14', 'Submitted 2x2 ID Picture'),
-- STU-005
('SA-STU-005-0', 'STU-005', '2025-06-05', 'Enrolled for 2nd Year, BSIT-2A'),
-- STU-006
('SA-STU-006-0', 'STU-006', '2023-06-01', 'Enrolled for 4th Year, BSIT-4A'),
('SA-STU-006-1', 'STU-006', '2026-09-01', 'Submitted Report Card'),
-- STU-007
('SA-STU-007-0', 'STU-007', '2026-06-02', 'Enrolled for 1st Year, BSIT-1B'),
-- STU-008
('SA-STU-008-0', 'STU-008', '2024-06-03', 'Enrolled for 3rd Year, BSIT-3B'),
-- STU-009
('SA-STU-009-0', 'STU-009', '2025-06-04', 'Enrolled for 2nd Year, BSIT-2B'),
-- STU-010
('SA-STU-010-0', 'STU-010', '2026-06-02', 'Enrolled for 1st Year, BSIT-1B'),
-- STU-011
('SA-STU-011-0', 'STU-011', '2023-06-01', 'Enrolled for 4th Year, BSIT-4A'),
-- STU-012
('SA-STU-012-0', 'STU-012', '2024-06-03', 'Enrolled for 3rd Year, BSIT-3A');