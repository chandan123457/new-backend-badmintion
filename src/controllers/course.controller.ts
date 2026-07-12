import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createCourse, deleteCourse, listCourses } from '../services/course.service';

const createCourseSchema = z.object({
  name: z.string().min(2),
  courseType: z.enum(['COACHING', 'MEMBERSHIP']),
  coachName: z.string().min(2),
  days: z.string().min(2),
  startTime: z.string().min(2),
  endTime: z.string().min(2),
  duration: z.coerce.number().int().positive(),
  monthlyFee: z.coerce.number().int().nonnegative(),
  maxCapacity: z.coerce.number().int().positive()
});

export async function getCourses(_request: Request, response: Response) {
  const courses = await listCourses();

  response.json({
    data: courses
  });
}

export async function postCourse(request: Request, response: Response) {
  const parsedBody = createCourseSchema.safeParse(request.body);

  if (!parsedBody.success) {
    response.status(400).json({
      message: 'Invalid course payload',
      errors: parsedBody.error.flatten()
    });
    return;
  }

  const course = await createCourse(parsedBody.data);

  response.status(201).json({
    data: course
  });
}

export async function deleteCourseById(request: Request<{ courseId: string }>, response: Response) {
  try {
    await deleteCourse(request.params.courseId);
    response.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      response.status(404).json({
        message: 'Course not found.'
      });
      return;
    }

    console.error('Failed to delete course', error);
    response.status(500).json({
      message: 'Unable to delete course right now.'
    });
  }
}
