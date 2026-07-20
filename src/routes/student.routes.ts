import { Router } from 'express';
import {
  deleteStudentById,
  getStudentById,
  getStudents,
  patchStudentPayment,
  patchStudentReactivation,
  postStudent
} from '../controllers/student.controller';

export const studentRouter = Router();

studentRouter.get('/', getStudents);
studentRouter.get('/:studentId', getStudentById);
studentRouter.post('/', postStudent);
studentRouter.patch('/:studentId/reactivate', patchStudentReactivation);
studentRouter.patch('/:studentId/payment', patchStudentPayment);
studentRouter.delete('/:studentId', deleteStudentById);
