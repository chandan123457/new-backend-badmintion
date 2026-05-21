import { Router } from 'express';
import { deleteStudentById, getStudentById, getStudents, postStudent } from '../controllers/student.controller';

export const studentRouter = Router();

studentRouter.get('/', getStudents);
studentRouter.get('/:studentId', getStudentById);
studentRouter.post('/', postStudent);
studentRouter.delete('/:studentId', deleteStudentById);
