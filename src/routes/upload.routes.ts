import { Router } from 'express';
import { postStudentPhoto } from '../controllers/upload.controller';

export const uploadRouter = Router();

uploadRouter.post('/student-photo', postStudentPhoto);
