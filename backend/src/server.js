import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session'; // <-- Added this
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { pool } from '../db.js'; // <-- Import pool for the session store

import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import { requireAuth } from './routes/auth.js';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import studentsRoutes from './routes/students.js';
import requirementsRoutes from './routes/requirements.js';
import studentRequirementsRoutes from './routes/studentRequirements.js';
import studentActivityRoutes from './routes/studentActivity.js';
import notificationsRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import pushRoutes from './routes/push.js';
import { startScheduler } from './jobs/scheduler.js';

const app = express();

// 1. Security & Logging
app.use(helmet());
app.set('trust proxy', 1); // Trust proxy (needed for secure cookies behind Nginx/Render/Heroku)

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 2. CORS (Must allow credentials for cookies)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: 'Too many requests, please try again later.'
});
app.use('/api', limiter);

// 4. Persistent MySQL Session Store
// The factory requires the session module to be passed in for ES Modules
const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({}, pool);

app.use(
  session({
    name: 'registrar.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    store: sessionStore, // <-- Now using the MySQL store
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', // Requires HTTPS in prod
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// 5. Routes
// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Protected routes (Requires Login)
app.use('/api/students', requireAuth, studentsRoutes);
app.use('/api/requirements', requireAuth, requirementsRoutes);
app.use('/api/student-requirements', requireAuth, studentRequirementsRoutes);
app.use('/api/student-activity', requireAuth, studentActivityRoutes);
app.use('/api/notifications', requireAuth, notificationsRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/push', requireAuth, pushRoutes);

// 6. Error Handling
app.use(notFound);
app.use(errorHandler);

// 7. Start Cron Jobs
startScheduler();

export default app;