import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { Prisma } from '@prisma/client';
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

// Last line of defence: any error a handler forwards ends up here as a JSON
// response instead of an unhandled rejection that terminates the process.
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error('Unhandled request error', error);

  if (response.headersSent) {
    return;
  }

  // P1001 = database unreachable (e.g. a suspended Neon compute waking up). It
  // surfaces either as a known request error or as an initialization error
  // depending on when the connection drops. Either way it is an upstream
  // outage, not a bad request, so report 503.
  // An initialization error always means the client could not reach the
  // database at all, whether or not the engine attached a P1001 code.
  const isDatabaseUnreachable =
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1001');

  if (isDatabaseUnreachable) {
    response.status(503).json({
      message: 'Database is temporarily unavailable. Please try again in a moment.'
    });
    return;
  }

  response.status(500).json({
    message: 'Something went wrong. Please try again.'
  });
});
