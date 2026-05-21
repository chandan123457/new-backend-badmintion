import { Router } from 'express';
import { getCourses, postCourse } from '../controllers/course.controller';

export const courseRouter = Router();

courseRouter.get('/', getCourses);
courseRouter.post('/', postCourse);
