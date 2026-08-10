import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createCourse, deleteCourse, listCourses, updateCourse } from '../services/course.service';

// Blank input from the app means "not provided", not an invalid value.
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalCount = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.number().int().nonnegative().optional()
);

const courseSchema = z.object({
  name: z.string().min(2),
  courseType: z.enum(['COACHING', 'MEMBERSHIP']),
  duration: z.coerce.number().int().positive(),
  monthlyFee: z.coerce.number().int().nonnegative(),
  coachName: optionalText,
  days: optionalText,
  startTime: optionalText,
  endTime: optionalText,
  maxCapacity: optionalCount
});

export async function getCourses(_request: Request, response: Response) {
  const courses = await listCourses();

  response.json({
    data: courses
  });
}

export async function postCourse(request: Request, response: Response) {
  const parsedBody = courseSchema.safeParse(request.body);

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

export async function patchCourse(request: Request<{ courseId: string }>, response: Response) {
  const parsedBody = courseSchema.safeParse(request.body);

  if (!parsedBody.success) {
    response.status(400).json({
      message: 'Invalid course payload',
      errors: parsedBody.error.flatten()
    });
    return;
  }

  try {
    const course = await updateCourse(request.params.courseId, parsedBody.data);

    response.json({
      data: course
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      response.status(404).json({
        message: 'Course not found.'
      });
      return;
    }

    console.error('Failed to update course', error);
    response.status(500).json({
      message: 'Unable to update course right now.'
    });
  }
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
