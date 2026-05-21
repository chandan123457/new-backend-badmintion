import type { Request, Response } from 'express';
import { listNotifications } from '../services/student.service';

export async function getNotifications(_request: Request, response: Response) {
  const notifications = await listNotifications();

  response.json({
    data: notifications
  });
}
