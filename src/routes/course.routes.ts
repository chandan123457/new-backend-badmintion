import { Router } from 'express';
import { deleteCourseById, getCourses, patchCourse, postCourse } from '../controllers/course.controller';
import { asyncHandler } from '../lib/async-handler';

export const courseRouter = Router();

courseRouter.get('/', asyncHandler(getCourses));
courseRouter.post('/', asyncHandler(postCourse));
courseRouter.patch('/:courseId', asyncHandler(patchCourse));
courseRouter.delete('/:courseId', asyncHandler(deleteCourseById));
