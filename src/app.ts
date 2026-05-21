import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { courseRouter } from './routes/course.routes';
import { notificationRouter } from './routes/notification.routes';
import { studentRouter } from './routes/student.routes';
import { uploadRouter } from './routes/upload.routes';

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN === '*' ? true : env.FRONTEND_ORIGIN
  })
);
app.use(express.json({ limit: '12mb' }));

app.get('/health', (_request, response) => {
  response.json({
    ok: true
  });
});

app.use('/api/courses', courseRouter);
app.use('/api/auth', authRouter);
app.use('/api/students', studentRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/uploads', uploadRouter);
