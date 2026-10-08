import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import usersRoutes from './routes/users.js';
import studentsRoutes from './routes/students.js';
import requirementsRoutes from './routes/requirements.js';
import studentRequirementsRoutes from './routes/studentRequirements.js';
import studentActivityRoutes from './routes/studentActivity.js';
import notificationsRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/users', usersRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/requirements', requirementsRoutes);
app.use('/api/student-requirements', studentRequirementsRoutes);
app.use('/api/student-activity', studentActivityRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;