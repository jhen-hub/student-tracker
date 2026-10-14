# Student Requirements and Document Tracking System

A full-stack web application built for managing student document requirements in an educational institution. The system simulates a school registrar's workflow for tracking student document submissions, requirements management, and administrative oversight.

## Overview

This system provides role-based access control for three user types:
- **Administrators**: Full system access including user management, settings, and all CRUD operations
- **Staff**: Limited access to student management, requirements viewing, and notifications
- **Students**: Personal dashboard to view their own requirements and submit documents

## Technology Stack

### Backend
- **Node.js** with **Express.js** framework
- **MySQL** database for persistent storage
- **Express-session** for authentication management
- **CORS** middleware for frontend-backend communication

### Frontend
- **React 18** with **Vite** build tool
- **React Router DOM** for client-side routing
- **Tailwind CSS** for utility-first styling
- **Lucide React** for icons
- **Recharts** for data visualization
- **React Context** for global state management

## System Architecture

### Data Flow

1. **User Authentication Flow**:
   - Frontend sends login credentials to `/api/auth/login`
   - Backend validates credentials against MySQL `users` table
   - On success, backend creates session and sets cookie
   - Frontend stores user context in React Context for global access
   - Subsequent API calls include credentials cookie for authentication

2. **Data Retrieval Flow**:
   - Frontend makes API requests to backend endpoints (e.g., `/api/students`)
   - Backend executes SQL queries against MySQL database
   - Backend returns JSON response to frontend
   - Frontend updates React Context and re-renders components

3. **Data Mutation Flow**:
   - Frontend sends POST/PATCH/DELETE requests with updated data
   - Backend validates request, executes SQL INSERT/UPDATE/DELETE
   - Backend returns success/error response
   - Frontend updates local state and may refetch data

### Key Data Entities

1. **Users** - System administrators, staff, and student accounts
2. **Students** - Student profile information linked to user accounts
3. **Requirements Catalog** - Master list of document requirements
4. **Student Requirements** - Junction table tracking each student's requirement status
5. **Student Activity** - Log of student-related actions and events
6. **Notifications** - System announcements and reminders
7. **Push Subscriptions** - WebPush subscription data
8. **Settings** - Application configuration key-value store

## Folder Structure

```
student=tracker/
├── backend/                  # Node.js/Express backend server
│   ├── db/                   # Database schema and initialization
│   │   └── schema.sql        # MySQL database schema with sample data
│   ├── src/                  # Backend source code
│   │   ├── jobs/             # Background job processing
│   │   │   └── scheduler.js  # Job scheduler for periodic tasks
│   │   ├── middleware/       # Custom Express middleware
│   │   │   ├── errorHandler.js   # Centralized error handling
│   │   │   └── notFound.js       # 404 route handler
│   │   ├── routes/           # API route handlers
│   │   │   ├── auth.js           # Authentication endpoints (login/logout/me)
│   │   │   ├── users.js          # User management CRUD operations
│   │   │   ├── students.js       # Student management CRUD operations
│   │   │   ├── requirements.js   # Requirements catalog CRUD operations
│   │   │   ├── studentRequirements.js  # Student requirement tracking
│   │   │   ├── studentActivity.js  # Student activity logging
│   │   │   ├── notifications.js  # Notification management
│   │   │   ├── settings.js       # System settings management
│   │   │   └── push.js           # Push notification subscriptions
│   │   ├── services/         # Business logic services
│   │   │   ├── digestService.js  # Periodic digest email generation
│   │   │   ├── pushService.js    # Push notification handling
│   │   │   └── reminderService.js # Reminder notification service
│   │   ├── server.js         # Express app configuration and middleware
│   │   └── index.js          # Server entry point
│   ├── .env                  # Environment variables (backend)
│   ├── .env.example          # Example environment variables
│   ├── .gitignore            # Git ignore rules
│   ├── package.json          # Backend dependencies and scripts
│   └── package-lock.json     # Locked dependency versions
│
├── frontend/                 # React/Vite frontend application
│   ├── public/               # Static assets served as-is
│   ├── src/                  # Frontend source code
│   │   ├── api/              # API service layer
│   │   │   ├── client.js     # API request wrapper with error handling
│   │   │   └── services/     # Service-specific API wrappers
│   │   │       ├── authService.js          # Authentication API calls
│   │   │       ├── notificationsService.js # Notification API calls
│   │   │       ├── pushService.js          # Push notification API calls
│   │   │       ├── requirementsService.js  # Requirements API calls
│   │   │       ├── settingsService.js      # Settings API calls
│   │   │       ├── studentActivityService.js # Student activity API calls
│   │   │       ├── studentRequirementsService.js # Student requirements API calls
│   │   │       ├── studentsService.js      # Students API calls
│   │   │       ├── usersService.js         # Users API calls
│   │   │       └── ...                     # Other service files
│   │   ├── assets/           # Static imports (logos, images)
│   │   │   └── logo.svg      # Application logo
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Layout.jsx            # Main layout wrapper
│   │   │   ├── Navbar.jsx            # Top navigation bar
│   │   │   ├── Sidebar.jsx           # Collapsible side navigation
│   │   │   ├── Modal.jsx             # Reusable modal dialog
│   │   │   ├── ConfirmDialog.jsx     # Confirmation dialog
│   │   │   ├── EmptyState.jsx        # Empty state placeholder
│   │   │   ├── SearchBar.jsx         # Search input component
│   │   │   ├── StatCard.jsx          # Statistics display card
│   │   │   ├── StatusBadge.jsx       # Status indicator badge
│   │   │   ├── Toast.jsx             # Notification toast
│   │   │   ├── ProtectedRoute.jsx    # Route guard for authentication
│   │   │   ├── RequirementChecklist.jsx # Requirement checklist display
│   │   │   └── ...                   # Other UI components
│   │   ├── context/            # React Context for state management
│   │   │   └── AppContext.jsx        # Global state + CRUD actions
│   │   ├── pages/              # Page components (routes)
│   │   │   ├── Dashboard.jsx         # System overview dashboard
│   │   │   ├── Login.jsx             # Authentication page
│   │   │   ├── Register.jsx          # User registration
│   │   │   ├── Profile.jsx           # User profile management
│   │   │   ├── Settings.jsx          # System settings (Admin only)
│   │   │   ├── Users.jsx             # User management (Admin only)
│   │   │   ├── Students.jsx          # Student list management
│   │   │   ├── StudentDetails.jsx    # Individual student detail view
│   │   │   ├── Requirements.jsx      # Requirements catalog management
│   │   │   ├── Reports.jsx           # Compliance reports and analytics
│   │   │   ├── Notifications.jsx     # Notification center
│   │   │   ├── StudentDashboard.jsx  # Student personal dashboard
│   │   │   ├── StudentRequirements.jsx # Student requirement checklist
│   │   │   └── ...                   # Other page components
│   │   ├── types/              # Type definitions and enums
│   │   │   ├── enums.js            # Shared enum definitions
│   │   │   ├── users.js            # User-related types
│   │   │   ├── students.js         # Student-related types
│   │   │   ├── requirements.js     # Requirement-related types
│   │   │   ├── studentActivity.js  # Student activity types
│   │   │   ├── studentRequirements.js # Student requirement types
│   │   │   ├── notifications.js    # Notification types
│   │   │   └── settings.js         # Settings types
│   │   ├── App.jsx             # Main application component with routing
│   │   ├── main.jsx            # Application entry point
│   │   ├── index.css         # Global CSS styles
│   │   └── ...                 # Other frontend files
│   ├── .env                  # Environment variables (frontend)
│   ├── .env.example          # Example environment variables
│   ├── .gitignore            # Git ignore rules
│   ├── index.html            # HTML template
│   ├── package.json          # Frontend dependencies and scripts
│   ├── package-lock.json     # Locked dependency versions
│   └── vite.config.js        # Vite configuration
│
├── documentation/            # Project documentation
│   └── IPT FINAL PROJECT.pdf # Detailed project specification
│
├── .gitignore                # Root git ignore rules
├── README.md                 # This file
└── ...                       # Other root files
```

## Environment Configuration

### Backend Environment Variables
Create `.env` in the `backend/` directory:
```
PORT=3000
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

### Frontend Environment Variables
Create `.env` in the `frontend/` directory:
```
VITE_API_URL=http://localhost:3000/api
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL server
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Vertudez
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   # Ensure MySQL is running and create the database
   # The schema will be auto-created on first connection
   npm run dev  # or npm start for production
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev  # Starts Vite dev server on http://localhost:5173
   ```

### Default Login Credentials
Use the demo login selector on `/login`, or sign in manually with:

| Role    | Email                     | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@registrar.edu       | admin123    |
| Staff   | staff@registrar.edu       | staff123    |
| Student | student@registrar.edu     | student123  |

You can also register a new demo account from `/register` — it's stored in the database.

## Key Features

### Authentication & Authorization
- Session-based authentication with secure cookies
- Role-based route protection (Admin/Staff/Student)
- Protected API endpoints with authentication middleware
- Password protection (hashed in production)

### Student Management
- Complete CRUD operations for student records
- Student enrollment tracking with year level and section
- Status management (Active/Inactive)
- Contact information maintenance

### Requirements Tracking
- Configurable requirements catalog with active/inactive toggling
- Per-student requirement status tracking (Submitted/Pending/Missing)
- Submission date tracking
- Bulk operations for requirement updates

### Administrative Functions
- User account management (create, edit, deactivate)
- System configuration through settings interface
- Notification creation and distribution
- Push notification subscription management
- Activity logging for audit trails

### Reporting & Analytics
- Dashboard with real-time statistics
- Compliance tracking and visualizations
- Filterable reports with export capabilities
- Requirement completion analytics

### Notifications System
- Create and manage system notifications
- Role-based and user-specific notification targeting
- Read/unread status tracking
- Push notification support

### Student Portal
- Personal dashboard showing individual statistics
- Personal requirements checklist with status indicators
- Profile management (information and password updates)
- Activity history viewing

## API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End user session
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Students
- `GET /api/students` - List all students
- `GET /api/students/:id` - Get specific student
- `POST /api/students` - Create new student
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Requirements
- `GET /api/requirements` - List all requirements
- `GET /api/requirements/:id` - Get specific requirement
- `POST /api/requirements` - Create new requirement
- `PATCH /api/requirements/:id` - Update requirement
- `DELETE /api/requirements/:id` - Delete requirement

### Student Requirements
- `GET /api/student-requirements` - List student requirements
- `GET /api/student-requirements/:id` - Get specific student requirement
- `POST /api/student-requirements` - Create student requirement
- `PATCH /api/student-requirements/:id` - Update student requirement
- `DELETE /api/student-requirements/:id` - Delete student requirement

### Student Activity
- `GET /api/student-activity` - List student activities
- `GET /api/student-activity/:id` - Get specific student activity
- `POST /api/student-activity` - Create student activity

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/:id` - Get specific notification
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications/:id` - Update notification
- `DELETE /api/notifications/:id` - Delete notification

### Settings
- `GET /api/settings` - List all settings
- `GET /api/settings/:key` - Get specific setting
- `POST /api/settings` - Create/update setting
- `DELETE /api/settings/:key` - Delete setting

### Push Notifications
- `GET /api/push` - List push subscriptions
- `POST /api/push` - Create push subscription
- `DELETE /api/push/:id` - Delete push subscription

## Database Design

### Core Tables

1. **users** - Authentication and authorization
   - id (PK), name, email, password, role, status, student_id (FK)

2. **students** - Student profile information
   - id (PK), user_id (FK), name, email, contact, year_level, section, status, enrolled_date

3. **requirements_catalog** - Master requirements list
   - id (PK), name, description, active

4. **student_requirements** - Junction table for student requirements
   - id (PK), student_id (FK), requirement_id (FK), status, submitted_at

5. **student_activity** - Activity logging
   - id (PK), student_id (FK), activity_date, activity_text

6. **notifications** - System announcements
   - id (PK), recipient_type, recipient_value, title, message, notification_date, read

7. **push_subscriptions** - WebPush subscriptions
   - id (PK), user_id (FK), endpoint, keys_p256dh, keys_auth, user_agent

8. **settings** - Application configuration
   - key (PK), value, updated_at

### Relationships
- Users ↔ Students (one-to-one, optional)
- Students → Student Requirements (one-to-many)
- Requirements Catalog → Student Requirements (one-to-many)
- Students → Student Activity (one-to-many)
- Users → Push Subscriptions (one-to-many)

## Security Considerations

- Session-based authentication with HTTP-only cookies
- Role-based access control enforced on both frontend and backend
- Input validation on all API endpoints
- SQL injection prevention through parameterized queries
- CORS configuration restricting origins
- Secure cookie settings in production
- Environment-based configuration management

## Development Guidelines

### Backend Development
- Follow RESTful API conventions
- Use async/await for asynchronous operations
- Implement proper error handling with try/catch
- Validate all inputs before processing
- Use connection pooling for database connections
- Follow MVC-like separation of concerns

### Frontend Development
- Use functional components with React hooks
- Leverage React Context for global state management
- Follow Tailwind CSS utility-first approach
- Create reusable components in the components directory
- Use proper error boundaries and loading states
- Follow consistent naming conventions

## Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

### Environment Variables for Production
Ensure proper values for:
- `NODE_ENV=production`
- Strong `SESSION_SECRET`
- Correct `CLIENT_URL` pointing to frontend domain
- Secure database credentials


```

## Acknowledgments

- Built as an IPT/Capstone final project
- Inspired by real-world school registrar systems
- Utilizes modern web development practices and technologies