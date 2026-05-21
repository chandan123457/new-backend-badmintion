import { prisma } from '../lib/prisma';
import type { CreateCourseInput } from '../types/course';

export async function listCourses() {
  const courses = await prisma.course.findMany({
    orderBy: {
      createdAt: 'asc'
    }
  });

  return courses.map((course) => ({
    ...course,
    availableSlots: Math.max(course.maxCapacity - course.enrolled, 0)
  }));
}

export async function createCourse(input: CreateCourseInput) {
  const course = await prisma.course.create({
    data: input
  });

  return {
    ...course,
    availableSlots: Math.max(course.maxCapacity - course.enrolled, 0)
  };
}
