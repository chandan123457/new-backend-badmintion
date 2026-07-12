import { Router } from 'express';
import {
  deleteStudentById,
  getStudentById,
  getStudents,
  patchStudentReactivation,
  postStudent
} from '../controllers/student.controller';

export const studentRouter = Router();

studentRouter.get('/', getStudents);
studentRouter.get('/:studentId', getStudentById);
studentRouter.post('/', postStudent);
studentRouter.patch('/:studentId/reactivate', patchStudentReactivation);
studentRouter.delete('/:studentId', deleteStudentById);
