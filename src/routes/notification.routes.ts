import { Router } from 'express';
import { getNotifications } from '../controllers/notification.controller';
import { asyncHandler } from '../lib/async-handler';

export const notificationRouter = Router();

notificationRouter.get('/', asyncHandler(getNotifications));
