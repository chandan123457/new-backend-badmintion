import type { Request, Response } from 'express';
import { z } from 'zod';
import { createCourse, listCourses } from '../services/course.service';

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
