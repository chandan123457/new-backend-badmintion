import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { CreateCourseInput } from '../types/course';

type CourseRecord = Prisma.CourseGetPayload<Record<string, never>>;

function formatCourse(course: CourseRecord) {
  return {
    id: course.id,
    name: course.name,
    courseType: course.courseType,
    coachName: course.coachName,
    days: course.days,
    startTime: course.startTime,
    endTime: course.endTime,
    duration: course.duration,
    monthlyFee: course.monthlyFee,
    maxCapacity: course.maxCapacity,
    enrolled: course.enrolled,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    availableSlots: Math.max(course.maxCapacity - course.enrolled, 0)
  };
}

export async function listCourses() {
  const courses = await prisma.course.findMany({
    where: {
      deletedAt: null
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return courses.map(formatCourse);
}

export async function createCourse(input: CreateCourseInput) {
  const course = await prisma.course.create({
    data: input
  });

  return formatCourse(course);
}

export async function deleteCourse(courseId: string) {
  // Soft delete: keep the row so already-enrolled students retain their course
  // details and expiry untouched. The course simply disappears from the active
  // list and from new-registration selection.
  await prisma.course.update({
    where: {
      id: courseId,
      deletedAt: null
    },
    data: {
      deletedAt: new Date()
    }
  });
}
