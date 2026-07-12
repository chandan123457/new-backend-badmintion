import { Router } from 'express';
import { deleteCourseById, getCourses, postCourse } from '../controllers/course.controller';

export const courseRouter = Router();

courseRouter.get('/', getCourses);
courseRouter.post('/', postCourse);
courseRouter.delete('/:courseId', deleteCourseById);
