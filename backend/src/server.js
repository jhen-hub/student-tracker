import express from 'express';
import cors from 'cors';
import session from 'express-session';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
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

// CORS must name the origin explicitly when credentials are enabled.
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

// Sessions. Default store is MemoryStore — fine for dev, wiped on restart.
// Swap in express-mysql-session later if you need durability.
app.use(
  session({
    name: 'registrar.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/requirements', requirementsRoutes);
app.use('/api/student-requirements', studentRequirementsRoutes);
app.use('/api/student-activity', studentActivityRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/push', pushRoutes);

app.use(notFound);
app.use(errorHandler);

startScheduler();

export default app;