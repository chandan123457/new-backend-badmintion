import { Router } from 'express';
import { postStudentPhoto } from '../controllers/upload.controller';
import { asyncHandler } from '../lib/async-handler';

export const uploadRouter = Router();

uploadRouter.post('/student-photo', asyncHandler(postStudentPhoto));
