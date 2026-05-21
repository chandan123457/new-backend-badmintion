import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createStudent, getStudent, listStudents, removeStudent } from '../services/student.service';

const createStudentSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(7),
  address: z.string().min(4),
  photoUrl: z.string().url(),
  courseId: z.string().min(1)
});

export async function getStudents(request: Request, response: Response) {
  try {
    const search = typeof request.query.search === 'string' ? request.query.search : undefined;
    const students = await listStudents(search);

    response.json({
      data: students
    });
  } catch (error) {
    console.error('Failed to fetch students', error);
    response.status(500).json({
      message: 'Unable to fetch students right now.'
    });
  }
}

export async function getStudentById(request: Request<{ studentId: string }>, response: Response) {
  try {
    const student = await getStudent(request.params.studentId);

    response.json({
      data: student
    });
  } catch (error) {
    console.error('Failed to fetch student', error);
    response.status(404).json({
      message: 'Student not found.'
    });
  }
}

export async function postStudent(request: Request, response: Response) {
  const parsed = createStudentSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      message: 'Invalid student payload',
      errors: parsed.error.flatten()
    });
    return;
  }

  try {
    const student = await createStudent(parsed.data);

    response.status(201).json({
      data: student
    });
  } catch (error) {
    console.error('Failed to create student', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      response.status(409).json({
        message: 'A student with this email already exists.'
      });
      return;
    }

    response.status(500).json({
      message: 'Unable to complete registration right now.'
    });
  }
}

export async function deleteStudentById(request: Request<{ studentId: string }>, response: Response) {
  try {
    await removeStudent(request.params.studentId);
    response.status(204).send();
  } catch (error) {
    console.error('Failed to delete student', error);
    response.status(404).json({
      message: 'Student not found.'
    });
  }
}
