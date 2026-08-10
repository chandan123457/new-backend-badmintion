import { Router } from 'express';
import {
  deleteStudentById,
  getStudentById,
  getStudents,
  patchStudentPayment,
  patchStudentReactivation,
  postStudent
} from '../controllers/student.controller';
import { asyncHandler } from '../lib/async-handler';

export const studentRouter = Router();

studentRouter.get('/', asyncHandler(getStudents));
studentRouter.get('/:studentId', asyncHandler(getStudentById));
studentRouter.post('/', asyncHandler(postStudent));
studentRouter.patch('/:studentId/reactivate', asyncHandler(patchStudentReactivation));
studentRouter.patch('/:studentId/payment', asyncHandler(patchStudentPayment));
studentRouter.delete('/:studentId', asyncHandler(deleteStudentById));
